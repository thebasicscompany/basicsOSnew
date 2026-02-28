# System Overview — Atomic CRM + Basics.so

A complete reference for how the unified AI context layer works, from browser to database to compute gateway.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│  Browser (React + Vite)                             │
│                                                     │
│  GatewayProvider   ──  API key + manage token       │
│  useGatewayChat    ──  sends UIMessage[]             │
│  ChatPage / SettingsPage                            │
└──────────────────────────┬──────────────────────────┘
                           │ POST /api/gateway-chat
                           │ Headers: X-Basics-API-Key
                           │ Body: { messages: UIMessage[] }
                           ▼
┌─────────────────────────────────────────────────────┐
│  packages/server  (Hono, port 3001)                 │
│                                                     │
│  1. Authenticate via Better Auth session cookie     │
│  2. Look up sales row (get sales_id + api_key)      │
│  3. Build CRM summary  ──  aggregate SQL queries    │
│  4. Embed query         ──  /v1/embeddings (remote) │
│  5. pgvector search     ──  match_context_embeddings│
│  6. Compose system prompt (base + summary + RAG)    │
│  7. Forward to /v1/chat/completions (stream)        │
│  8. Transcode OpenAI SSE → AI SDK v4 data stream   │
└──────────────────────────┬──────────────────────────┘
                           │ Bearer bos_live_sk_*
                           ▼
┌─────────────────────────────────────────────────────┐
│  basics.so  (api.basics.so / localhost:3002)        │
│                                                     │
│  /v1/chat/completions  ──  LLM (Gemini 2.5 Pro)     │
│  /v1/embeddings        ──  basics-embed (3072 dims) │
│  /v1/audio/speech      ──  TTS (Deepgram)           │
│  /v1/audio/transcription  STT (Deepgram)            │
│  /v1/email/send        ──  Transactional email      │
│                                                     │
│  Stateless compute — stores nothing                 │
└─────────────────────────────────────────────────────┘
```

---

## 1. Authentication

### Client
`src/providers/GatewayProvider.tsx` manages the user's `bos_live_sk_*` API key in `localStorage` (keyed by user ID). It also fetches a short-lived **manage token** from `/api/gateway-token` for billing/account operations on basics.so.

### Server
`packages/server/src/middleware/auth.ts` validates the Better Auth session cookie on every protected route. After auth the handler fetches the matching `sales` row which holds the user's `salesId` and optional `basicsApiKey`.

---

## 2. CRM Data Store

All CRM data lives in **PostgreSQL** (local: Neon-compatible, prod: Neon). Drizzle ORM is used for typed queries.

Key tables:
| Table | Purpose |
|---|---|
| `sales` | One row per user. Holds `basics_api_key` |
| `contacts` | People |
| `companies` | Organizations |
| `deals` | Pipeline opportunities |
| `contact_notes` | Notes attached to contacts |
| `deal_notes` | Notes attached to deals |
| `tasks` | Actionable items linked to contacts |
| `context_embeddings` | pgvector index — one row per embeddable entity |

---

## 3. Embeddings Pipeline

Every time a record is written to the CRM via the REST API (`/api/:resource`), the server fires-and-forgets an embedding job.

### Trigger (packages/server/src/routes/crm.ts)
```
POST /api/contacts  →  insert row  →  upsertEntityEmbedding(...)
PUT  /api/contacts/:id  →  update row  →  upsertEntityEmbedding(...)
DELETE /api/contacts/:id  →  delete row  →  deleteEntityEmbedding(...)
```
Same pattern for companies, deals, contact_notes, deal_notes.

### Text serialization (packages/server/src/lib/embeddings.ts → buildEntityText)
Each entity type is serialized to a human-readable string:
- **contact**: `"Alice Chen. Email: alice@acme.com. Title: VP Sales. Background: ..."`
- **company**: `"Acme Corp. Sector: Technology. City: New York. Description: ..."`
- **deal**: `"Delta Health AI. Stage: proposal. Value: $55000. Description: ..."`
- **contact_note / deal_note**: raw note text

### Storage
`upsertEntityEmbedding` calls `POST /v1/embeddings` on basics.so with `model: "basics-embed"`, gets back a 3072-dimension vector, then upserts it into `context_embeddings`:

```sql
INSERT INTO context_embeddings (sales_id, entity_type, entity_id, chunk_text, embedding, updated_at)
VALUES ($1, $2, $3, $4, '[...]'::vector, now())
ON CONFLICT (sales_id, entity_type, entity_id) DO UPDATE ...
```

The unique index `(sales_id, entity_type, entity_id)` means there is exactly one embedding per entity per user.

> **Cold start**: Records that existed before embeddings were enabled have no entry in `context_embeddings`. They are not returned by RAG. Embeddings are created on the next write (update/re-save).

---

## 4. Context Injection

On every chat request the server builds a dynamic system prompt in two parts:

### Part A — CRM Summary (always included)
`packages/server/src/lib/context.ts → buildCrmSummary`

Runs 3 parallel aggregate queries (never loads full records):
1. Open deal count + total pipeline value
2. Overdue task count
3. 5 most recently-created contact names

Produces:
```
- Open deals: 5 (total value: $250,000)
- Overdue tasks: 3
- Recent contacts: Alice Chen, Bob Smith, Carol White
```

This gives the model instant awareness of the user's CRM state at zero cost.

### Part B — RAG Context (query-dependent)
`packages/server/src/lib/context.ts → retrieveRelevantContext`

1. Embed the last user message using `POST /v1/embeddings` (model: `basics-embed`)
2. Run pgvector cosine similarity search via the SQL function `match_context_embeddings(sales_id, query_vector, limit=5)`
3. Return the top-K chunks formatted as `[entity_type] chunk_text`

The SQL function:
```sql
SELECT entity_type, entity_id, chunk_text
FROM context_embeddings
WHERE sales_id = $1 AND embedding IS NOT NULL
ORDER BY embedding <=> $query_vector
LIMIT $limit;
```

If the query has no relevant matches (or embeddings fail) this section is omitted gracefully.

### Composed System Prompt
```
You are an AI assistant for a CRM. Help the user manage contacts, deals, companies, tasks, and notes. Be concise and helpful.

## Your CRM
- Open deals: 5 (total value: $250,000)
- Overdue tasks: 3
- Recent contacts: Alice Chen, Bob Smith

## Relevant context
[deal] Delta Health AI. Stage: proposal. Value: $55000. Description: AI analytics platform.
[contact] Alice Chen. Email: alice@acme.com. Title: VP Sales.
```

This is injected as the `system` message before the conversation history is forwarded to the LLM.

---

## 5. Chat Streaming

### Protocol translation
basics.so returns standard **OpenAI Server-Sent Events** (`data: {"choices":[{"delta":...}]}`).

The `@ai-sdk/react` `useChat` hook expects the **AI SDK v4 data stream protocol** (single-digit codes like `0:`, `b:`, `c:`, `9:`, `d:`).

`packages/server/src/routes/gateway-chat.ts` performs this translation in a streaming `ReadableStream`, reading each SSE chunk and re-emitting it in the correct format:

| OpenAI event | AI SDK code | Meaning |
|---|---|---|
| `delta.content` | `0:` | Text delta |
| `delta.tool_calls[n].id+name` | `b:` | Tool call start |
| `delta.tool_calls[n].arguments` | `c:` | Tool call args delta |
| `finish_reason: tool_calls` | `9:` + `e:` + `d:` | Complete tool call |
| `finish_reason: stop` | `d:` | Message done |

### Tool calling (currently disabled)
`CRM_TOOLS` are defined in `gateway-chat.ts` (search_contacts, get_contact, create_contact, search_deals, search_companies, list_tasks, create_task, list_notes, create_note) but are **not sent** to the model due to a Gemini 2.5 Pro bug that returns empty responses when tools are included. Tool calling will be re-enabled once the gateway model is updated or switched.

When tools are enabled, execution is **client-side**: `useGatewayChat` catches tool calls via `onToolCall`, calls the CRM REST API directly from the browser, and feeds results back to the conversation.

---

## 6. API Key Architecture (Revenue Model)

```
User →  basics.so dashboard  →  gets  bos_live_sk_*  key
     →  Settings page in app  →  stores key in localStorage
     →  every AI request passes key to packages/server
     →  server forwards key to basics.so
```

All AI capabilities (LLM, embeddings, STT, TTS, email) gate behind the basics.so API key. The "unified AI context layer" — where the CRM, voice app, and automations all share the same context — only works when a user has a basics.so key. This is the monetization hook: the key unlocks the unified experience.

Users can optionally use their own provider keys (OpenAI, Anthropic, Gemini, Deepgram) via BYOK headers (`X-Byok-Provider`, `X-Byok-Api-Key`) without going through basics.so billing.

---

## 7. Key Files Reference

| File | Purpose |
|---|---|
| `packages/server/src/routes/gateway-chat.ts` | Chat endpoint: auth, context injection, stream proxy |
| `packages/server/src/lib/context.ts` | `buildCrmSummary` + `retrieveRelevantContext` |
| `packages/server/src/lib/embeddings.ts` | `buildEntityText` + `upsertEntityEmbedding` + `deleteEntityEmbedding` |
| `packages/server/src/routes/crm.ts` | CRM REST API — triggers embeddings on write |
| `packages/server/src/db/schema/context_embeddings.ts` | Drizzle schema for vector table (3072 dims) |
| `packages/server/drizzle/0000_lying_puck.sql` | DB migration including `match_context_embeddings()` SQL function |
| `src/providers/GatewayProvider.tsx` | Client: API key state + localStorage + manage token |
| `src/hooks/useGatewayChat.ts` | Client: `useChat` wrapper → `/api/gateway-chat` |
| `src/components/pages/ChatPage.tsx` | Chat UI |
| `src/components/pages/SettingsPage.tsx` | API key input |

---

## 8. Data Flow — End to End

**User types**: "Tell me about the Delta Health deal"

1. `useGatewayChat` sends `POST /api/gateway-chat` with `messages` array and `X-Basics-API-Key` header
2. Server authenticates session cookie → resolves `sales_id = 42`
3. Server runs in parallel:
   - `buildCrmSummary(42)` → 3 SQL aggregates → "Open deals: 8 (total value: $420,000)..."
   - `retrieveRelevantContext(42, "Tell me about the Delta Health deal")`:
     - `POST api.basics.so/v1/embeddings` with the query → 3072-dim vector
     - `SELECT ... FROM match_context_embeddings(42, '[0.01, 0.03, ...]'::vector, 5)` → top 5 similar chunks
     - Returns `"[deal] Delta Health AI. Stage: proposal. Value: $55000. Description: AI analytics platform.\n[contact] Alice Chen..."`
4. System prompt assembled with summary + RAG context
5. `POST api.basics.so/v1/chat/completions` with system prompt + conversation history, `stream: true`
6. SSE stream received → transcoded to AI SDK v4 format → piped back to browser
7. `useChat` in browser renders streaming tokens in real time
8. AI responds: *"The Delta Health AI deal is currently in the proposal stage with a value of $55,000..."*

---

## 9. Scaling Notes

- **pgvector HNSW index** can handle millions of rows with sub-10ms similarity search
- `buildCrmSummary` uses aggregate SQL — O(1) regardless of record count
- `match_context_embeddings()` returns at most `limit` rows — no full table scans
- Embeddings are generated fire-and-forget and never block the write response
- Each user's embeddings are scoped by `sales_id` — complete tenant isolation
- The `basics-embed` model (Gemini) returns 3072-dimension vectors stored as `vector(3072)` in PostgreSQL

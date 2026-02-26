# BasicOS CRM MVP — Implementation Plan

**Goal:** Turn Basics CRM into the OSS CRM standard with an inbuilt AI assistant, unified context layer, and unified API key (users pay Basics for OpenAI, Deepgram, Resend, etc.).

**Scope for MVP:** Web app only. MCP, overlay, desktop/mobile/Electron → later.

**Branch:** `feature/basicos-ai-assistant`

---

## 1. Current State Summary

| Component | What Exists |
|-----------|-------------|
| **Basics CRM** | Vite + React + Supabase. Contacts, companies, deals, tasks, notes, sales. Full CRUD, import/export. |
| **basicsAdmin (gateway)** | Hono API at `api.basics.so`. `/v1/chat/completions`, `/v1/embeddings`, `/v1/audio/*`. Auth via `bos_live_sk_*` keys. Stripe billing. LiteLLM + Deepgram. |
| **Unified context** | ❌ Not built. Gateway is stateless; no vector storage or RAG. |

---

## 2. Decided Architecture (Updated)

### 2.1 Auth & API Keys

- **Auth:** Supabase Auth (unchanged). Users log in as today.
- **API key:** One Basics API key **per user**. Stored in `sales` table (or user settings) — each sales user links their own key.
- **Provisioning:** Users get keys from basicsAdmin dashboard; CRM Settings UI to paste/link key.

### 2.2 Unified Context Layer

- **Context sources:** Index **everything** — contacts, companies, notes (contact + deal), deals, tasks.
- **Scope:** Per user (sales_id / user_id). Each user's context is isolated.
- **Vector store:** **pgvector in Supabase** — single DB, no extra services, RLS-friendly, simpler ops. Trade-off: at millions of rows, dedicated vector DBs (Pinecone, Qdrant) scale better; for CRM MVP, pgvector is sufficient and keeps the stack minimal.

### 2.3 AI Assistant

- **Actions:** Read-only for MVP. Context retrieval only (RAG).
- **Future automations:** Use **MCP** when we add actions. MCP server exposes tools (`create_task`, `add_note`, etc.); AI calls them. Keeps CRM logic in one place.

### 2.4 Chat UI

- **Reference:** Use **Vercel AI SDK** (`ai` + `@ai-sdk/react`) with `useChat` for streaming. Clone patterns from:
  - [Vercel AI SDK Chatbot example](https://sdk.vercel.ai/elements/examples/chatbot)
  - [shadcn/ui AI components](https://ui.shadcn.com) (project already uses shadcn)
- **Stack:** Keep **Vite + React**. No Next.js migration for MVP. Backend UI (basicsAdmin) is separate and already Next.js.

### 2.5 Next.js?

- **Stay with Vite** for the CRM web app. No benefit for this use case.

### 2.6 Portability: API and Database Separation

- **Goal:** Users who clone this repo should be able to swap the database (Supabase → Neon, PlanetScale, etc.) without rewriting everything.
- **API and database logic must be separate.** No tight coupling to Supabase.
- **Use a standalone API** (Hono/Express) instead of Supabase Edge Functions. Deployable anywhere (Railway, Fly.io, Vercel, self-hosted).
- **Database abstraction:** API uses a DB adapter interface. Default: Supabase/Postgres. User can swap for another adapter.

---

## 3. Proposed Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Basics CRM (Web - Vite + React)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │ Contacts    │  │ Deals       │  │ AI Assistant (chat UI)           │  │
│  │ Companies   │  │ Tasks       │  │ - useChat → fetch /assistant      │  │
│  │ Notes       │  │ Sales       │  │                                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                            │
         │                    │                            │
         ▼                    ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Standalone API (Hono/Express) — packages/api or apps/api    │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ POST /assistant  — RAG: embed query → similarity search → chat       ││
│  │ POST /index      — Index entity (optional, or webhook from CRM)       ││
│  │                                                                      ││
│  │ DB Adapter (swappable): Supabase | Neon | pg | Prisma | etc.         ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────────────┐
│  Database (swappable)       │    │  basicsAdmin Gateway (api.basics.so) │
│  - CRM tables               │    │  POST /v1/chat/completions  → LiteLLM │
│  - context_embeddings       │    │  POST /v1/embeddings        → LiteLLM │
│  (pgvector, any Postgres)   │    │  POST /v1/audio/*           → Deepgram│
└─────────────────────────────┘    └─────────────────────────────────────┘
```

### 3.1 Unified Context Flow

1. **Indexing (write path):** When a contact, note, deal, or task is created/updated:
   - CRM data provider (or webhook) notifies API, or API polls / DB triggers invoke.
   - API builds text chunk, calls basicsAdmin embeddings, stores in `context_embeddings` via DB adapter.
   - Default: Supabase. User can swap DB adapter.

2. **Retrieval (read path):** When user asks the AI assistant:
   - Frontend sends user message to API `POST /assistant` (with auth header).
   - API: resolve user → sales row → get Basics API key.
   - API: embed query via basicsAdmin `/v1/embeddings`.
   - API: similarity search via DB adapter (`SELECT ... FROM context_embeddings WHERE sales_id = ? ORDER BY embedding <=> ?`).
   - API: build system prompt with chunks + user message.
   - API: call basicsAdmin `/v1/chat/completions`, stream response back.

### 3.2 Why Standalone API (Not Supabase Edge Functions)?

- **Portability:** Users who switch from Supabase to Neon/PlanetScale/etc. would need to replace Edge Functions. A standalone API with a DB adapter can stay; only the adapter changes.
- **Separation of concerns:** API logic = orchestration. DB logic = adapter. Cleaner.
- **Deploy anywhere:** Railway, Fly.io, Vercel serverless, self-hosted. No Supabase lock-in.

---

## 4. Implementation Phases

### Phase 1: Foundation (1–2 weeks)

| Task | Description |
|------|-------------|
| 1.1 | Create standalone API (`packages/api` or `apps/api`). Hono or Express. Deployable anywhere. |
| 1.2 | Add DB adapter interface. Default adapter: Supabase/Postgres. Adapter provides: `getUserApiKey`, `similaritySearch`, `upsertEmbedding`, etc. |
| 1.3 | Add pgvector migration. Create `context_embeddings` table. Works with any Postgres (Supabase, Neon, etc.) via adapter. |
| 1.4 | Add `basics_api_key` (encrypted) to `sales` table — one key per user. UI in Settings/Profile to paste/link key. |
| 1.5 | Implement `POST /assistant` route: auth → fetch key → embed → similarity search → chat → stream. |
| 1.6 | Add `VITE_API_URL` and `VITE_BASICOS_API_URL` to CRM env. |

### Phase 2: Indexing (1–2 weeks)

| Task | Description |
|------|-------------|
| 2.1 | Define chunk schemas for contacts, companies, notes, deals, tasks (what text to embed). |
| 2.2 | Implement `POST /index` (or webhook) in API: receives entity, builds chunk, calls basicsAdmin embeddings, upserts via DB adapter. |
| 2.3 | Wire CRM data provider lifecycle: on create/update, call API `/index` (or use DB trigger that invokes API). |
| 2.4 | Backfill script: one-time migration to index existing CRM data. |
| 2.5 | Handle deletes: remove embeddings when entity is deleted. |

### Phase 3: AI Assistant UI (1–2 weeks)

| Task | Description |
|------|-------------|
| 3.1 | Add floating chat button + panel (or `/assistant` route). |
| 3.2 | Chat UI: use Vercel AI SDK `useChat` + shadcn-style components. Message list, input, streaming response. |
| 3.3 | Wire `useChat` to `VITE_API_URL/assistant`. Pass auth (Supabase JWT or session) so API can resolve user + API key. |
| 3.4 | Optional: "Ask about this contact/deal" context from detail pages. |

### Phase 4: Polish & Launch (1 week)

| Task | Description |
|------|-------------|
| 4.1 | Error handling: invalid key, quota exceeded, gateway down. |
| 4.2 | Loading states, empty state when no key configured. |
| 4.3 | Docs: how to get a Basics API key, how to configure CRM, how to swap DB adapter. |
| 4.4 | Optional: usage display (if basicsAdmin exposes usage API). |

---

## 5. Data Model Additions

### 5.1 `context_embeddings` (Postgres — via DB adapter)

Works with any Postgres (Supabase, Neon, etc.). Migration lives in API or shared migrations.

```sql
-- Enable pgvector
create extension if not exists vector;

create table context_embeddings (
  id bigint generated by default as identity primary key,
  sales_id bigint not null references sales(id) on delete cascade,  -- per-user context
  entity_type text not null,  -- 'contact' | 'company' | 'note' | 'deal' | 'task'
  entity_id bigint not null,
  chunk_text text not null,
  embedding vector(1536),  -- OpenAI ada-002 / LiteLLM default
  created_at timestamptz default now(),
  unique (sales_id, entity_type, entity_id)
);

create index on context_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);  -- tune based on row count

create index on context_embeddings (sales_id);
```

### 5.2 API Key Storage (Per User)

- Add `basics_api_key_encrypted` to `sales` table. Each sales user has their own key.
- Encrypt at rest (DB-specific: Supabase Vault, or app-level). UI in Profile/Settings to paste key.

### 5.3 DB Adapter Interface (for portability)

```ts
// Example interface — user can implement for their DB
interface ContextDbAdapter {
  getUserApiKey(userId: string): Promise<string | null>;
  similaritySearch(salesId: number, queryEmbedding: number[], limit: number): Promise<ContextChunk[]>;
  upsertEmbedding(salesId: number, entityType: string, entityId: number, chunkText: string, embedding: number[]): Promise<void>;
  deleteEmbedding(entityType: string, entityId: number): Promise<void>;
}
```

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|-------------|
| basicsAdmin and CRM use different auth (API key vs Supabase JWT) | API resolves user → sales row → stored API key. All basicsAdmin calls use that key. |
| Embedding cost at scale | Batch indexing; rate limit; only index on change, not full resync. |
| Latency (embed + search + chat) | Stream chat so user sees progress; consider caching for repeated queries. |
| basicsAdmin not deployed | Fallback: document "requires Basics API key" and disable assistant if not configured. |
| DB lock-in | DB adapter pattern allows swapping Supabase for Neon/PlanetScale/etc. without rewriting API logic. |

---

## 7. Future: MCP for Automations

When we add assistant *actions* (create task, add note, update deal), use **MCP (Model Context Protocol)**. MCP server exposes tools; AI calls them. Keeps CRM logic in one place.

## 8. Out of Scope for MVP

- MCP server (planned for automations)
- Overlay / meeting assistant
- Desktop / mobile / Electron
- Assistant *actions* (read-only for now)
- Resend/email integration (separate feature)
- Multi-tenant admin (multiple orgs in one deploy)

---

## 9. Next Steps

1. ~~**Phase 1** — Standalone API + DB adapter + pgvector + `sales.basics_api_key` + `POST /assistant`.~~ ✅ Done
2. **Phase 2** — Indexing pipeline (contacts, companies, notes, deals, tasks).
3. **Phase 3** — Chat UI with Vercel AI SDK + shadcn.

---

## 10. Phase 1 Implementation Summary (Completed)

- **`packages/api`** — Hono server with `POST /assistant`, `GET /health`
- **DB adapter** — `ContextDbAdapter` interface + Supabase implementation
- **Migration** — `20260226180000_context_embeddings_and_basics_key.sql` (pgvector, context_embeddings, sales.basics_api_key, match_context_embeddings RPC)
- **Env** — `VITE_API_URL`, `VITE_BASICOS_API_URL` in `.env.development`
- **Run** — `npm run dev:api` or `make start-api`

---

*Document version: 1.2 — Added: Standalone API (Hono/Express) instead of Supabase Edge Functions, DB adapter for portability, API/database separation. Users can swap DB without rewriting.*

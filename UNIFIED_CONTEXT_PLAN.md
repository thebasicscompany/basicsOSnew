# Unified Context Layer — Implementation Plan

## Goal

A single typed `GatewayClient` + `GatewayProvider` that is the one place all surfaces
(chat, voice, MCP, email) get their auth and communicate with the Gateway API.
CRM tool definitions let the AI read **and** write CRM data using the same functions
the UI already uses, with TanStack Query as the shared state cache.

---

## Auth model (clarified)

| Surface | Auth token | Gateway path |
|---|---|---|
| AI chat, audio, embeddings, email | `bos_live_sk_...` API key | `/v1/*` |
| Tenant management, billing, usage | Better Auth session token | `/manage/*` |

> **Bug to fix:** `useAssistantChatForHub` currently uses `useSupabaseSession`
> but the app is on Better Auth. This will be corrected in Phase 6.

API key lifecycle: user copies their key from the basics.so dashboard → pastes it
in the Settings page → stored in `localStorage` keyed by user ID → loaded by
`GatewayProvider` on startup. Migration path to server-side storage is clear.

---

## Phase 1 — Gateway Types & Base Client

**New files:**
- `src/lib/gateway/types.ts`
- `src/lib/gateway/client.ts`

### `types.ts`
Shared TypeScript interfaces matching the Gateway spec exactly:

```ts
interface GatewayError {
  message: string
  type: string
  param: string | null
  code: string   // "invalid_api_key" | "billing_canceled" | "rate_limit_exceeded" | ...
}

interface ChatMessage { role: "system" | "user" | "assistant"; content: string }
interface ChatRequest { model: string; messages: ChatMessage[]; stream?: boolean; tools?: unknown[] }
interface ModelInfo { id: string; object: "model"; owned_by: string; capabilities: string[] }
interface TranscriptionResult { transcript: string; confidence?: number; [key: string]: unknown }
interface EmbeddingResult { object: "list"; data: { index: number; embedding: number[] }[]; model: string }
interface EmailResult { id: string; ok: boolean }
// ... billing, usage, tenant, key types per spec
```

### `client.ts`
Two factory functions — one per auth mode:

```ts
function createApiClient(apiKey: string): ApiClient
function createManageClient(sessionToken: string): ManageClient
```

Both wrap `fetch` to:
- Inject `Authorization` header
- Parse the OpenAI-style `{ error: { message, code } }` error shape and throw a
  typed `GatewayApiError extends Error` with `.code`, `.type`, `.status`
- Return typed response bodies

**Acceptance criteria:**
- [ ] `GatewayApiError` has `.code` (for error-specific UI messaging)
- [ ] Both clients are plain objects (no class, no React, no hooks)
- [ ] Errors thrown consistently — callers never need to `.json()` manually

---

## Phase 2 — Endpoint Modules

**New files:**
- `src/lib/gateway/chat.ts`
- `src/lib/gateway/audio.ts`
- `src/lib/gateway/manage.ts`
- `src/lib/gateway/email.ts`
- `src/lib/gateway/index.ts`

Each module takes a client instance and exposes typed functions.

### `chat.ts`
```ts
// Returns the raw Response so callers can stream SSE or read JSON
chatCompletions(client: ApiClient, request: ChatRequest): Promise<Response>
```
Streaming is handled by the consumer (`useGatewayChat` uses `@ai-sdk/react` which
handles SSE parsing natively for OpenAI-compatible endpoints).

### `audio.ts`
```ts
transcribe(client: ApiClient, input: File | { audio: string; mimeType: string }): Promise<TranscriptionResult>
speak(client: ApiClient, input: string, options?: { voice?: string; encoding?: string }): Promise<Blob>
```
`transcribe` auto-selects multipart vs JSON based on input type.
`speak` returns a `Blob` — callers do `URL.createObjectURL(blob)` for `<audio>`.

### `manage.ts`
```ts
provision(client: ManageClient): Promise<{ tenantId: string }>
getKeys(client: ManageClient): Promise<ApiKey[]>
createKey(client: ManageClient, name?: string): Promise<NewApiKey>
revokeKey(client: ManageClient, id: string): Promise<void>
getTenant(client: ManageClient): Promise<{ company: string }>
updateTenant(client: ManageClient, data: { company: string }): Promise<{ company: string }>
getUsage(client: ManageClient, days?: number): Promise<UsageReport>
getBilling(client: ManageClient): Promise<BillingInfo>
createCheckout(client: ManageClient, data: CheckoutRequest): Promise<{ url: string; sessionId: string }>
createPortal(client: ManageClient, returnUrl?: string): Promise<{ url: string }>
changePlan(client: ManageClient, plan: string): Promise<ChangePlanResult>
```

### `email.ts`
```ts
sendEmail(client: ApiClient, data: EmailRequest): Promise<EmailResult>
```

### `index.ts`
Re-exports all modules and types as a single import surface:
```ts
import { createApiClient, createManageClient, transcribe, speak, sendEmail, ... } from "@/lib/gateway"
```

**Acceptance criteria:**
- [ ] All functions are pure (no React, no global state)
- [ ] Return types match the spec exactly
- [ ] `chatCompletions` returns raw `Response` (streaming-friendly)

---

## Phase 3 — GatewayProvider + useGateway

**New files:**
- `src/providers/GatewayProvider.tsx`
- `src/hooks/useGateway.ts`

**Modified files:**
- `src/App.tsx` — wrap routes in `<GatewayProvider>`

### `GatewayProvider.tsx`
Context value shape:
```ts
interface GatewayContextValue {
  // Key management
  apiKey: string | null
  hasKey: boolean
  setApiKey: (key: string) => void
  clearApiKey: () => void

  // Ready-to-use clients (null when not available)
  apiClient: ApiClient | null      // null when no API key
  manageClient: ManageClient | null  // null when no session

  // Gateway base URL
  gatewayUrl: string
}
```

Internal logic:
1. Reads Better Auth session via `authClient.useSession()` (NOT Supabase)
2. Derives user ID from session to namespace the localStorage key:
   `localStorage.getItem("bos_key_${session.user.id}")`
3. `setApiKey` validates prefix (`bos_live_sk_` or `bos_test_sk_`), saves to localStorage
4. `apiClient` and `manageClient` are memoized with `useMemo` on their inputs

### `useGateway.ts`
```ts
export function useGateway(): GatewayContextValue
```
Throws if called outside `GatewayProvider`.

### App.tsx change
```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <GatewayProvider>   {/* ← add this */}
      <Routes>...
```

**Acceptance criteria:**
- [ ] Key persists across page refreshes for the same user
- [ ] Key is cleared on sign-out (listen to Better Auth session becoming null)
- [ ] Clients are memoized — not re-created on every render
- [ ] `hasKey` is `false` when key is null or empty string
- [ ] `manageClient` uses Better Auth token, updates when session refreshes

---

## Phase 4 — Settings Page: API Key UI

**Modified file:**
- `src/components/pages/SettingsPage.tsx`

Add a **"Basics API"** section:
- Shows key status: masked hint `bos_live_sk_abc...xyz1` if configured, else "Not configured"
- Controlled input for pasting a new key (type=`password`, toggle visibility)
- Save button — validates prefix, calls `setApiKey(key)`, shows success toast
- Clear button — calls `clearApiKey()`, shows confirmation
- A small callout linking to the basics.so dashboard for users who need a key

**Acceptance criteria:**
- [ ] Validation: must start with `bos_live_sk_` or `bos_test_sk_`
- [ ] Shows masked key (not full key) after saving
- [ ] `hasKey` in GatewayProvider updates immediately (reactive)
- [ ] No full key ever rendered in DOM after initial save

---

## Phase 5 — CRM Tool Definitions

**New files:**
```
src/lib/gateway/tools/
  types.ts
  contacts.ts
  deals.ts
  companies.ts
  tasks.ts
  notes.ts
  index.ts
```

### Tool structure (`types.ts`)
```ts
interface CrmTool<TParams = unknown, TResult = unknown> {
  name: string
  description: string        // LLM-facing: WHEN and WHY to call this
  parameters: JSONSchema     // Strict JSON Schema — no `any`, no loose `object`
  execute: (params: TParams) => Promise<TResult>
}
```

### Why this is "unified"
Tool `execute` functions call the **same** `getList / getOne / create / update / remove`
from `src/lib/api/crm.ts` that the React hooks use. The AI and the UI share one data
layer. There is no duplication.

### Tool list

**`contacts.ts`**
| Tool | Operation | CRM function |
|---|---|---|
| `search_contacts` | List with optional name/email/status filter | `getList("contacts_summary", ...)` |
| `get_contact` | Single contact by ID | `getOne("contacts_summary", id)` |
| `create_contact` | Create new contact | `create("contacts", data)` |
| `update_contact` | Update fields on existing contact | `update("contacts", id, data)` |

**`deals.ts`**
| Tool | Operation | CRM function |
|---|---|---|
| `search_deals` | List with optional stage/category filter | `getList("deals", ...)` |
| `get_deal` | Single deal by ID | `getOne("deals", id)` |
| `create_deal` | Create new deal | `create("deals", data)` |
| `update_deal` | Update deal (stage, amount, etc.) | `update("deals", id, data)` |

**`companies.ts`**
| Tool | Operation | CRM function |
|---|---|---|
| `search_companies` | List with name filter | `getList("companies_summary", ...)` |
| `create_company` | Create new company | `create("companies", data)` |

**`tasks.ts`**
| Tool | Operation | CRM function |
|---|---|---|
| `list_tasks` | Tasks for a contact or deal | `getList("tasks", { filter: { contact_id } })` |
| `create_task` | Create task linked to contact/deal | `create("tasks", data)` |
| `complete_task` | Mark task done | `update("tasks", id, { done: true })` |

**`notes.ts`**
| Tool | Operation | CRM function |
|---|---|---|
| `list_notes` | Notes for a contact | `getList("notes", { filter: { contact_id } })` |
| `create_note` | Add a note | `create("notes", data)` |

### `index.ts`
Exports `ALL_CRM_TOOLS: CrmTool[]` — the full array passed to the model.

**Acceptance criteria:**
- [ ] All tools are pure functions — no React, no hooks, no side effects beyond HTTP
- [ ] JSON Schema parameters are tight (required fields, enum where applicable)
- [ ] Descriptions are written for the model: explain intent, not just structure
- [ ] `search_*` tools support at least a `query` string for free-text search

---

## Phase 6 — useGatewayChat Hook

**New file:** `src/hooks/useGatewayChat.ts`

**Deleted:** `src/hooks/useAssistantChatForHub.ts`

**Modified:** `src/components/pages/ChatPage.tsx` → import from `useGatewayChat`

### Implementation

Uses `@ai-sdk/react` `useChat` pointed **directly at the Gateway** (no backend proxy
needed — the Gateway is OpenAI-compatible SSE):

```ts
useChat({
  api: `${gatewayUrl}/v1/chat/completions`,
  headers: { Authorization: `Bearer ${apiKey}` },
  body: { model: "basics-chat-smart" },
  tools: buildAiSdkTools(ALL_CRM_TOOLS),   // adapter: CrmTool[] → AI SDK tool format
  maxSteps: 5,
  onToolCall: async ({ toolCall }) => {
    const tool = ALL_CRM_TOOLS.find(t => t.name === toolCall.toolName)
    return tool ? await tool.execute(toolCall.args) : "Tool not found"
  },
  onFinish: ({ toolCalls }) => {
    // Invalidate TanStack Query cache for any CRM data the assistant mutated
    const written = toolCalls?.map(t => t.toolName) ?? []
    if (written.some(n => n.includes("contact"))) queryClient.invalidateQueries({ queryKey: ["contacts_summary"] })
    if (written.some(n => n.includes("deal")))    queryClient.invalidateQueries({ queryKey: ["deals"] })
    if (written.some(n => n.includes("compan")))  queryClient.invalidateQueries({ queryKey: ["companies_summary"] })
    if (written.some(n => n.includes("task")))    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    if (written.some(n => n.includes("note")))    queryClient.invalidateQueries({ queryKey: ["notes"] })
  },
  onError: handleGatewayError,
})
```

`buildAiSdkTools` is a small adapter that converts `CrmTool[]` to the format
`useChat` expects (`{ [name]: { description, parameters, execute } }`).

### Error handler
```ts
function handleGatewayError(error: Error) {
  const code = (error as GatewayApiError).code
  if (code === "invalid_api_key")           toast.error("Invalid API key — check Settings")
  else if (code === "billing_canceled")     toast.error("Subscription required — check billing")
  else if (code === "rate_limit_exceeded")  toast.error("Rate limit reached, try again shortly")
  else if (!apiKey)                         toast("Add your Basics API key in Settings", { action: ... })
  else                                      toast.error(error.message.slice(0, 120))
}
```

### No-key state
When `hasKey` is false, the hook returns early with a static system message prompting
the user to configure their key. No API calls are made, no error toasts.

**Acceptance criteria:**
- [ ] Uses Better Auth session — no `useSupabaseSession` anywhere
- [ ] Streams responses from Gateway in real time
- [ ] Tool calls execute client-side against `src/lib/api/crm.ts`
- [ ] Mutations → TanStack Query invalidation → UI updates without manual refresh
- [ ] Handles missing API key gracefully (inline prompt, not toast spam)
- [ ] `maxSteps: 5` allows multi-step reasoning (search → create → confirm)

---

## Phase 7 — Voice Wiring

**New file:** `src/hooks/useGatewayAudio.ts`

```ts
export function useGatewayAudio() {
  const { apiClient } = useGateway()
  return {
    transcribe: (file: File) => transcribe(apiClient!, file),
    speak: (text: string, options?) => speak(apiClient!, text, options),
    isAvailable: !!apiClient,
  }
}
```

VoiceApp integration:
1. Record audio → `transcribe(file)` → transcript text
2. Text → `append({ role: "user", content: transcript })` into `useGatewayChat`
3. AI response text → `speak(responseText)` → Blob → `<audio autoplay>`

All through the same API key, same `apiClient`, same CRM tools.

**Acceptance criteria:**
- [ ] `transcribe` works with a `File` (browser MediaRecorder output)
- [ ] `speak` returns a playable Blob
- [ ] Both fail gracefully when `apiClient` is null (no key configured)

---

## Phase 8 — Cleanup

- [ ] Delete `src/hooks/useSupabaseSession.ts` (only consumer was `useAssistantChatForHub`)
- [ ] Delete `src/hooks/useAssistantChatForHub.ts`
- [ ] Update `MEMORY.md` with final architecture

---

## Key architectural decisions

| Decision | Choice | Reason |
|---|---|---|
| tRPC | **No** | Gateway is a REST API we consume, not build. tRPC wrapping REST = pure overhead. |
| Backend proxy for chat | **No** | Gateway is OpenAI-compatible SSE. `useChat` can hit it directly. |
| Tool execution location | **Client-side** | UI and AI share one data layer. Mutations update TanStack cache immediately. |
| Auth | **Better Auth** (not Supabase JWT) | App already migrated. `useSupabaseSession` is a leftover bug. |
| API key storage | **localStorage** (→ DB later) | Fast to ship. Clear migration: move `setApiKey` to call `/api/me` instead. |
| Shared state | **TanStack Query cache** | Already in use. `invalidateQueries` after tool mutations keeps all views in sync. |

---

## File map

```
src/lib/gateway/
├── types.ts              ← shared types matching Gateway spec
├── client.ts             ← createApiClient(), createManageClient()
├── chat.ts               ← chatCompletions()
├── audio.ts              ← transcribe(), speak()
├── manage.ts             ← provision(), getKeys(), getBilling(), etc.
├── email.ts              ← sendEmail()
├── index.ts              ← re-exports everything
└── tools/
    ├── types.ts          ← CrmTool<> interface + JSONSchema type
    ├── contacts.ts       ← search_contacts, get_contact, create_contact, update_contact
    ├── deals.ts          ← search_deals, get_deal, create_deal, update_deal
    ├── companies.ts      ← search_companies, create_company
    ├── tasks.ts          ← list_tasks, create_task, complete_task
    ├── notes.ts          ← list_notes, create_note
    └── index.ts          ← ALL_CRM_TOOLS array + buildAiSdkTools() adapter

src/providers/
└── GatewayProvider.tsx   ← context: apiClient, manageClient, setApiKey, hasKey

src/hooks/
├── useGateway.ts         ← useContext shortcut
├── useGatewayChat.ts     ← replaces useAssistantChatForHub
└── useGatewayAudio.ts    ← transcribe + speak hooks

(modified)
src/App.tsx                           ← wrap in GatewayProvider
src/components/pages/SettingsPage.tsx ← API key UI
src/components/pages/ChatPage.tsx     ← use useGatewayChat
```

---

## Build order

1. `types.ts` + `client.ts` (no deps)
2. `chat.ts`, `audio.ts`, `manage.ts`, `email.ts` (depend on client)
3. `gateway/index.ts`
4. `tools/` (depend on `src/lib/api/crm.ts`, no React)
5. `GatewayProvider` + `useGateway` (depend on gateway lib + Better Auth)
6. `SettingsPage` update (depends on `useGateway`)
7. `useGatewayChat` (depends on all of the above)
8. `ChatPage` update (depends on `useGatewayChat`)
9. `useGatewayAudio` + Voice wiring
10. Cleanup

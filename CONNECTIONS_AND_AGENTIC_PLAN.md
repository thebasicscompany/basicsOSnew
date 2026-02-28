# Connections + Agentic Automations — Implementation Plan (Revised)

> **Key revision**: OAuth credentials do NOT live in the CRM repo.
> They live in the Basics gateway (basicsAdmin). Self-hosters need zero OAuth setup.

---

## The Core Architecture Question

### Who holds the OAuth credentials?

**Wrong approach (original plan):**
Each self-hoster registers their own Slack app, Google OAuth Client, etc. and puts the credentials in their `.env`. This is terrible UX — most users don't know how to create an OAuth app and every deployment needs different redirect URIs whitelisted.

**Right approach:**
The **Basics gateway** (api.basics.so) acts as the OAuth broker — exactly like Zapier does. When you connect Slack on Zapier, you're authorizing *Zapier's* Slack app. You don't register anything yourself.

Self-hosters already need a Basics API key for AI features (chat, embeddings). Adding integrations uses the exact same key — zero new config required.

```
Self-hoster's CRM (packages/server)
      │  user's bos_live_sk_... API key
      ▼
Basics Gateway (api.basics.so)          ← holds Slack/Google OAuth apps
      │
      ├─ POST /v1/connections/slack/authorize  →  Slack OAuth
      ├─ POST /v1/execute/slack/message        →  Slack API
      ├─ POST /v1/execute/gmail/read           →  Gmail API
      └─ POST /v1/execute/gmail/send           →  Gmail API
```

The CRM server has **zero OAuth credentials**. It calls the gateway. The gateway holds the Slack/Google apps, manages tokens, handles refresh. This is also why users don't see raw tokens — they never leave the gateway.

---

## What Gets Built Where

### In `basicsAdmin/packages/gateway` (the managed service)

These are the foundational pieces. Nothing in the CRM repo works without these.

#### New DB table: `gateway.connections`

```sql
-- infra/supabase/migrations/YYYYMMDD_connections.sql
CREATE TABLE gateway.connections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES gateway.tenants(id) ON DELETE CASCADE,
  provider       text NOT NULL,          -- 'slack' | 'google' | 'github'
  account_name   text,                  -- display: "My Workspace" or "user@gmail.com"
  account_avatar text,
  encrypted_access_token  text NOT NULL, -- AES-256-GCM encrypted
  encrypted_refresh_token text,
  expires_at     timestamptz,
  scopes         text,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);
```

Token encryption: AES-256-GCM with a `CONNECTIONS_ENCRYPTION_KEY` env var on the gateway. Tokens never leave the gateway in plaintext.

#### New gateway routes

```
# Called by CRM server — returns a URL to redirect the browser to
GET /v1/connections/:provider/authorize?redirect_after=<encoded_crm_url>
→ { url: "https://slack.com/oauth/v2/authorize?client_id=...&state=<signed_jwt>" }

# Browser lands here after user approves on Slack/Google (redirect_uri on the OAuth app)
GET /v1/connections/:provider/callback?code=...&state=...
→ Exchange code for token, store encrypted, redirect to redirect_after

# List user's connected providers
GET /v1/connections
→ [{ provider, accountName, accountAvatar, connectedAt, scopes }]  ← NO tokens

# Remove a connection
DELETE /v1/connections/:provider

# Execute integration actions during automations
POST /v1/execute/slack/message     { channel, text }
POST /v1/execute/gmail/read        { query, maxResults }
POST /v1/execute/gmail/send        { to, subject, body }
```

All `/v1/*` routes are already protected by the API key middleware — no new auth needed.

#### The OAuth state problem

The callback (`/v1/connections/slack/callback`) arrives in the browser with a `state` param but no API key in scope. How does the gateway know which tenant to store the token for?

**Solution: signed JWT state.** When generating the authorize URL, the gateway encodes `{ tenantId, redirectAfter }` into a short-lived (10 min) JWT signed with a gateway secret. The callback verifies this JWT and extracts `tenantId`.

```typescript
// /authorize handler
const state = await new SignJWT({ tenantId: auth.tenant.id, redirectAfter })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("10m")
  .sign(CONNECTIONS_STATE_SECRET);

// /callback handler
const { tenantId, redirectAfter } = await jwtVerify(state, CONNECTIONS_STATE_SECRET);
// → store token for tenantId, then:
return c.redirect(redirectAfter + "?connected=slack");
```

Stateless. No session needed. `jose` is already installed in the gateway.

#### Auto-refresh on execute

When `/v1/execute/slack/message` is called, the gateway:
1. Fetches the connection for this `tenantId + provider`
2. If `expires_at < now() + 5min` → calls provider's token refresh endpoint, stores new token
3. Calls the actual Slack/Gmail API
4. Returns result

Token refresh is handled silently. CRM server never knows it happened.

#### Providers to register (gateway side)

| Provider | OAuth App Registration | Scopes |
|---|---|---|
| **Slack** | api.slack.com → Create App | `chat:write`, `channels:read`, `users:read` |
| **Google** | console.cloud.google.com → OAuth 2.0 | `gmail.readonly`, `gmail.send` |

Both need `https://api.basics.so/v1/connections/slack/callback` (and `/google/callback`) as authorized redirect URIs.

**For self-hosters who point to a self-hosted gateway**: they'd add their own OAuth apps and set `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in their gateway `.env`. The gateway code checks for these and falls back gracefully if missing.

---

### In `packages/server` (the CRM, zero OAuth credentials)

#### New server routes — proxy to gateway

```typescript
// packages/server/src/routes/connections.ts

// List connections — GET /api/connections
GET /api/connections
  → fetch(`${BASICOS_API_URL}/v1/connections`, { headers: { Authorization: `Bearer ${apiKey}` } })
  → return response as-is

// Start OAuth — GET /api/connections/:provider/authorize
GET /api/connections/:provider/authorize
  → const redirectAfter = `${BETTER_AUTH_URL}/connections`;
  → fetch(`${BASICOS_API_URL}/v1/connections/${provider}/authorize?redirect_after=${encode(redirectAfter)}`)
  → { url } = response
  → c.redirect(url)   // browser goes to Slack/Google OAuth page

// Disconnect — DELETE /api/connections/:provider
DELETE /api/connections/:provider
  → fetch(`${BASICOS_API_URL}/v1/connections/${provider}`, { method: "DELETE", ... })
```

That's it. No `arctic`. No encryption keys. No OAuth client IDs. The server just proxies.

#### Automation executor — new action types

```typescript
// packages/server/src/lib/automation-actions/slack.ts
export async function executeSlack(config, ctx, apiKey, env) {
  const channel = resolveTemplate(config.channel, ctx);
  const text = resolveTemplate(config.message, ctx);

  const res = await fetch(`${env.BASICOS_API_URL}/v1/execute/slack/message`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Gateway returns structured error including "Slack not connected"
    throw new Error(err.error?.message ?? "Slack action failed");
  }
  return { slack_result: await res.json() };
}
```

```typescript
// packages/server/src/lib/automation-actions/gmail-read.ts
export async function executeGmailRead(config, ctx, apiKey, env) {
  const query = resolveTemplate(config.query ?? "is:unread", ctx);
  const res = await fetch(`${env.BASICOS_API_URL}/v1/execute/gmail/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, maxResults: config.maxResults ?? 5 }),
  });
  const { messages } = await res.json();
  return { gmail_messages: messages }; // → {{gmail_messages}} in context
}
```

The pattern is identical across all integration actions: call gateway, pass API key, get result. If the user hasn't connected that provider, the gateway returns a clear error which surfaces in the automation run log.

#### New automation node types in executor switch

```typescript
// automation-executor.ts additions:
case "action_slack":      return await executeSlack(node.data, ctx, apiKey, env);
case "action_gmail_read": return await executeGmailRead(node.data, ctx, apiKey, env);
case "action_gmail_send": return await executeGmailSend(node.data, ctx, apiKey, env);
case "action_crm_read":   return await executeCrmRead(node.data, ctx, db, salesId);
case "action_ai_agent":   return await executeAIAgent(node.data, ctx, db, salesId, apiKey, env);
```

---

### In `packages/automations` (the frontend)

#### Connections page — `src/components/pages/ConnectionsPage.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│  Connections                                                │
│  Connect services to use in your automations.              │
├──────────────────────┬──────────────────────────────────────┤
│  [Slack logo]        │  [Gmail logo]                        │
│  Slack               │  Gmail                               │
│  Send messages to    │  Read and send emails from your      │
│  channels and DMs    │  Google account                      │
│                      │                                      │
│  ● Connected         │  Connect →                           │
│  My Workspace        │                                      │
│  [Disconnect]        │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

- On "Connect": calls `GET /api/connections/slack/authorize` → server redirects browser to Slack
- After OAuth: browser lands back on `/connections?connected=slack` → toast + refetch
- On "Disconnect": `DELETE /api/connections/slack`
- If no Basics API key configured: shows alert linking to Settings

```typescript
const { data: connections = [] } = useQuery({
  queryKey: ["connections"],
  queryFn: () => fetchApi<Connection[]>("/api/connections"),
});

const handleConnect = (provider: string) => {
  window.location.href = `${API_URL}/api/connections/${provider}/authorize`;
};
```

#### Connection requirement warnings in node config panels

When configuring a Slack node, the config panel checks if Slack is connected:

```typescript
function ConnectionRequired({ provider }: { provider: string }) {
  const { data: connections = [] } = useQuery({ queryKey: ["connections"], ... });
  const connected = connections.some(c => c.provider === provider);
  if (connected) return null;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      Slack not connected.{" "}
      <a href="/connections" className="underline">Connect it in Connections →</a>
    </div>
  );
}
```

#### New node components (same pattern as existing)

- `SlackActionNode.tsx` — Slack logo, shows channel name
- `GmailReadNode.tsx` — Gmail icon, shows query
- `GmailSendNode.tsx` — Gmail icon, shows to address
- `CrmReadNode.tsx` — Database icon, shows resource type
- `AIAgentNode.tsx` — Sparkles, shows objective truncated

All added to `TRIGGER_ITEMS`/`ACTION_ITEMS` in `AutomationBuilderPage.tsx`.

---

## Agentic AI — Still No LangChain

The `action_ai_agent` node uses `generateText` from the Vercel AI SDK (already in `packages/server/package.json`):

```typescript
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export async function executeAIAgent(config, ctx, db, salesId, apiKey, env) {
  const openai = createOpenAI({
    baseURL: `${env.BASICOS_API_URL}/v1`,
    apiKey,
  });

  const { text } = await generateText({
    model: openai(config.model ?? "basics-chat-smart"),
    maxSteps: config.maxSteps ?? 6,
    system: `You are a CRM automation agent. ${await buildCrmSummary(db, salesId)}`,
    prompt: resolveTemplate(config.objective, ctx),
    tools: {
      getContacts: tool({
        description: "Search CRM contacts",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => { /* drizzle query */ },
      }),
      getDeals: tool({ ... }),
      createTask: tool({ ... }),
      updateDeal: tool({ ... }),
      // Only include if connected:
      ...(await hasConnection(db, salesId, "slack") ? { sendSlack: tool({ ... }) } : {}),
    },
  });
  return { ai_agent_result: text };
}
```

The SDK handles the tool-calling loop: LLM picks a tool → tool runs → result back to LLM → repeat until `maxSteps` or done. No orchestration library needed.

---

## Implementation Order

### Phase 0 — Gateway (basicsAdmin work, prerequisite)
1. Register Slack app + Google OAuth app, get client IDs/secrets
2. Add `CONNECTIONS_STATE_SECRET`, `CONNECTIONS_ENCRYPTION_KEY` to gateway env
3. Add `gateway.connections` migration
4. Add `arctic` to gateway package (for typed OAuth helpers)
5. Implement `/v1/connections/:provider/authorize` + `/callback` routes
6. Implement `/v1/connections` (list) + `DELETE /v1/connections/:provider`
7. Implement `/v1/execute/slack/message`, `/v1/execute/gmail/read`, `/v1/execute/gmail/send`

### Phase 1 — CRM server proxy routes (packages/server)
8. `routes/connections.ts` — thin proxies to gateway
9. Wire into `app.ts`

### Phase 2 — New action executors (packages/server)
10. `automation-actions/slack.ts`
11. `automation-actions/gmail-read.ts` + `gmail-send.ts`
12. `automation-actions/crm-read.ts`
13. `automation-actions/ai-agent.ts` (Vercel AI SDK `generateText`)
14. Wire all into `automation-executor.ts`

### Phase 3 — Frontend (packages/automations + src/)
15. `ConnectionsPage.tsx` + route + sidebar link
16. Handle `?connected=provider` query param on arrival → toast
17. New node components (Slack, Gmail Read, Gmail Send, CRM Read, AI Agent)
18. Node config forms with `<ConnectionRequired provider="slack" />` warnings
19. Add new node types to `TRIGGER_ITEMS`/`ACTION_ITEMS` in builder

---

## Package Summary

| Package | Where | Purpose | Adds |
|---|---|---|---|
| `arctic` | **basicsAdmin/gateway** | Typed OAuth 2.0 client | Slack, Google typed OAuth helpers |
| `ai` (Vercel AI SDK) | packages/server | Agentic tool-calling loop | Already installed, use `generateText` |
| `jose` | basicsAdmin/gateway | Sign/verify JWT state | Already installed |
| Node `crypto` | basicsAdmin/gateway | Token encryption | Built-in, no install |

**Zero new dependencies in the CRM repo.**

---

## What Self-Hosters Actually Experience

1. Clone the repo, run `make install`
2. Get a Basics API key from basics.so (same as today for AI features)
3. Go to Connections page → click "Connect Slack" → authorize → done
4. Build automations with Slack nodes

No OAuth apps to register. No client IDs. No redirect URIs to whitelist. Just the Basics API key they already have.

---

## Open Questions

1. **What's the redirect_after domain allowlist?**
   The gateway should only redirect to known-safe origins after OAuth. Options:
   - Allow any origin (simple but security risk)
   - Allowlist based on tenant's registered app URL (stored in `tenants` table)
   - Require redirect_after to match a `CORS_ORIGINS` env var

   Recommendation: store `app_url` on the tenant record (via `PATCH /manage/tenant`) and only allow redirects to that URL.

2. **What if Basics.so is down?**
   Automations requiring integrations will fail. Same as today if Basics is down (AI features fail too). Acceptable for a Basics-first stack.

3. **Fully self-hosted (no Basics) option?**
   Could add a fallback: if `SLACK_CLIENT_ID` + `SLACK_CLIENT_SECRET` are set in `packages/server/.env`, handle OAuth locally using `arctic` directly in the CRM server. This is the escape hatch for enterprises that can't use external services. Not needed for v1.

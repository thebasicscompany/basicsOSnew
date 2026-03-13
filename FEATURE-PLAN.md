# Full System Agent Expansion + Pill Notifications + Onboarding Redesign

## Context

The AI agent (shared by chat + voice pill via `processChatTurn`) currently has 19 CRM-only tools. The goal is to make the agent "do everything in the system" — automations, Slack, web search, email search, delete/bulk operations, relationships — plus proactive pill notifications, redesigned onboarding, fixed shortcuts, bidirectional Slack, and smart record creation for a VC deal pipeline workflow.

**No send_email yet** — email sending deferred. Search emails is included.
**No Playwright/browser automation.**

**Branch strategy:** Checkout `origin/main`, create `feature/agent-expansion`.

---

## The Full VC Deal Flow (What This Enables)

1. **Deal enters** via email sync (deal-scorer.ts) or Slack bot → creates Deal + Contact + Company
2. **First meeting** recorded via pill → meeting.completed fires → pill notification asks "link this to a deal?" → agent links meeting to contact/company/deal, creates follow-up tasks
3. **Slack diligence** — team discusses in Slack, @mentions bot → agent logs notes on deals, answers deal questions from CRM data
4. **Investment memo** — deal reaches final stage → `deal.stage_changed` automation fires → AI reads all deal data, contacts, notes, meeting summaries → generates memo as deal note → notifies user via pill
5. **Reminders** — task due dates → pill notifications → "Respond in chat" → handle conversationally

---

## PHASE 1: Core Agent Tool Expansion (13 new tools)

### 1A. Expand `executeValidatedTool` signature

**File:** `packages/server/src/routes/gateway-chat/tools.ts` (line 132)

Add `ToolExecutionContext` type:
```typescript
type ToolExecutionContext = {
  gatewayUrl: string;
  gatewayHeaders: Record<string, string>;
  crmUserId: number;
  env: Env;
  gatewayApiKey: string;
  userId: string;
};
```
Replace loose `searchContext?: HybridSearchContext` param. Update 3 call sites in `gateway-chat.ts`.

### 1B. New tools (schemas + OPENAI_TOOL_DEFS + handlers)

**File:** `packages/server/src/routes/gateway-chat/protocol.ts` + `tools.ts`

| Tool | Params | Implementation |
|------|--------|----------------|
| `web_search` | query, num_results? | `executeWebSearch` from `lib/automation-actions/web-search.ts` |
| `list_automations` | limit? | Query `automationRules` by orgId |
| `create_automation` | name, trigger_type?, trigger_config?, actions? | Insert `automationRules`, call `reloadRule` |
| `update_automation` | id, name?, enabled? | Update `automationRules`, call `reloadRule` |
| `delete_automation` | id | Delete from `automationRules` |
| `run_automation` | id | `triggerRunNow(id, crmUserId)` from `lib/automation-engine.ts` |
| `search_emails` | query?, from_email?, limit? | Query `syncedEmails` with ilike on subject/body/from |
| `send_slack_message` | channel, message | `executeSlack` from `lib/automation-actions/slack.ts` |
| `delete_record` | resource (contact/company/deal), id or name | Soft-delete deals, hard-delete others |
| `delete_task` | id | Delete from tasks |
| `link_contact_to_deal` | deal_id/name, contact_id/name | Insert/delete `dealContacts` |
| `get_deal_contacts` | deal_id or deal_name | Query dealContacts joined with contacts |
| `search_all` | query, limit? | Parallel search contacts+companies+deals, merge results |

### 1C. Reuse existing infrastructure
- `executeWebSearch` from `packages/server/src/lib/automation-actions/web-search.ts`
- `executeSlack` from `packages/server/src/lib/automation-actions/slack.ts`
- `triggerRunNow` / `reloadRule` from `packages/server/src/lib/automation-engine.ts`
- `resolveContactByName` / `resolveDealByName` / `resolveCompanyByName` from `packages/server/src/lib/resolve-by-name.ts`
- `searchContactsByQuery` / `searchCompaniesByQuery` / `searchDealsByQuery` from same file
- `syncedEmails` table from `packages/server/src/db/schema/synced-emails.ts`

### 1D. System prompt updates (protocol.ts BASE_SYSTEM_PROMPT)

Add guidance:
- **First-principles context gathering (CRITICAL):** Before performing ANY action, check if you have all required context. If not, ask the user. Never assume or fill in blanks. This applies to everything — creating records, running automations, sending Slack messages, deleting records, linking entities. If you don't know, ask.
- When creating ANY record (contact, company, deal, task), proactively ask for ALL missing fields: name, email, company, deal amount, status, associated contacts/companies, etc. Don't create a half-filled record.
- After creating contact+company+deal, use `link_contact_to_deal` to connect them all.
- Never send Slack unless explicitly asked
- Never delete without confirming the exact record first
- When user mentions a meeting, help link it to the right deal/contact/company
- Can search synced emails to find relevant context about deals/contacts

### 1E. Update TOOL_TITLE_MAP

**File:** `src/overlay/lib/use-ai-response.ts` (line 23)

Add entries for all 13 new tools. Update write-tool detection (line 49).

### 1F. Update gateway-chat.ts

- Pass expanded context to `executeValidatedTool`
- Add `send_slack_message` to `ONCE_ONLY_TOOLS`

**Files modified:** `protocol.ts`, `tools.ts`, `gateway-chat.ts`, `use-ai-response.ts`

---

## PHASE 2: Expanded Automation Triggers

### 2A. Expand event firing guards

**Files:** `services/crm/create-record.ts` (line 98), `update-record.ts` (line 100), `delete-record.ts` (line 51)

Change `["deals", "contacts", "tasks"]` → `["deals", "contacts", "tasks", "companies"]`

### 2B. Add note events

In `tools.ts` after each note insert (create_note, add_note), call:
```typescript
fireEvent("note.created", { entityType, entityId, noteId, text }, crmUserId)
```
Also add fireEvent in REST API note creation routes.

### 2C. Add meeting events

**File:** `packages/server/src/routes/meetings.ts`

- `fireEvent("meeting.created", ...)` after meeting insert
- `fireEvent("meeting.completed", ...)` on status change to "completed"
- `fireEvent("meeting_link.created", ...)` after meeting_links insert

**Key for VC flow:** `meeting.completed` triggers the pill notification asking user to link the meeting.

### 2D. Add deal.stage_changed event

**File:** `services/crm/update-record.ts`

When resource is "deals" and status field changed, fire `deal.stage_changed` with `{ dealId, oldStatus, newStatus, dealName }`.

**Key for VC flow:** This is the trigger for investment memo generation.

### 2E. Update TriggerEventNode dropdown

**File:** `packages/automations/src/nodes/TriggerEventNode.tsx`

Expand EVENT_OPTIONS: `company.*`, `note.created`, `meeting.created`, `meeting.completed`, `meeting_link.created`, `deal.stage_changed`

**File:** `packages/automations/src/NodeConfigPanel.tsx` — update label

---

## PHASE 3: Pill Proactive Notifications + "Respond in Chat"

### 3A. New pill state: "notification"

**File:** `src/overlay/lib/notch-pill-state.ts`

- Add `"notification"` to PillState
- New actions: `NOTIFICATION` (title, body, actions[]), `NOTIFICATION_DISMISS`
- New context fields: `notificationTitle`, `notificationBody`, `notificationActions`

### 3B. Notification IPC bridge

**Files:** `src/preload/index.ts`, `src/preload/index.d.ts`, `src/shared-overlay/types.ts`

Add `onNotification` IPC channel: main process → overlay window via `push-notification`

### 3C. Backend notification push (SSE)

**Create:** `packages/server/src/routes/notifications.ts`

SSE endpoint (`GET /api/notifications/stream`) — keeps connection alive. Provides `sendNotification(orgId, userId, payload)` used by:
- Automation executor (`action_notify_user` node)
- Task reminder scheduler
- Meeting completion handler (post-meeting prompt)

**File:** `src/main/index.ts` — Connect to SSE on app startup, forward to overlay

### 3D. Notification pill UI — passive notification center model

**File:** `src/overlay/lib/pill-components.tsx`

`NotificationPill` component: title + body + response options. **PASSIVE — never auto-listens.**

The pill acts like a notification center. It shows the notification and gives the user explicit choices for how to respond:
- **"Press [shortcut] to respond"** — shows the current assistant shortcut label (from shortcut-definitions.ts). User presses it, pill enters listening mode with notification context.
- **"Respond in chat"** button — opens main window to chat with context pre-filled
- **"Dismiss"** (X button) — dismisses notification

Auto-dismiss after 30s if user doesn't interact (longer than regular responses since these are important).

**Examples:**
- "Your meeting just ended. Was this with anyone in your contacts or related to a deal?" → [Press Cmd+Space to respond] [Respond in chat] [✕]
- "Task due: Send deck to John @ Acme Corp" → [Press Cmd+Space to respond] [Respond in chat] [✕]
- "Investment memo for Acme Corp has been created" → [View Deal] [✕]
- "Deal 'Acme Corp' hasn't moved stages in 14 days" → [Press Cmd+Space to respond] [Respond in chat] [✕]

### 3E. Response options on pill

**File:** `src/overlay/OverlayApp.tsx`

Add response options to both `response` and `notification` states:
- **"Respond in chat"** button: `navigateMain('/chat?context=...')` + dismiss
- **"Press [shortcut] to respond"** label: visual hint, not a button. When user presses the shortcut, pill transitions to listening with the notification/response context preserved in `conversationHistory`

**Important:** Do NOT auto-activate listening. The pill is passive until the user explicitly chooses to respond.

**File:** Chat page — read URL params, pre-fill input with notification context.

### 3F. Automation "Notify User" action node

**Create:** `packages/automations/src/nodes/NotifyUserActionNode.tsx`
**Modify:** `packages/server/src/lib/automation-executor.ts` — add `action_notify_user` case
**Modify:** `packages/automations/src/builderConstants.ts` — register node type

### 3G. Task reminder scheduler

**Create:** `packages/server/src/lib/task-reminder-scheduler.ts`

pg-boss scheduled job (every 5-15 min): tasks with approaching due dates → push pill notifications.

### 3H. Post-meeting linking prompt

When `meeting.completed` fires, send a notification via SSE:
- Title: "Meeting just ended"
- Body: "Was this meeting with anyone in your contacts or related to a deal?"
- Actions: ["Respond in chat", "Dismiss"]

User taps "Respond in chat" → chat opens with context → agent helps link meeting to deal/contact/company, create follow-up tasks from meeting summary action items.

---

## PHASE 4: Onboarding Redesign + Shortcut Labels Fix

### 4A. New full-screen onboarding

**Create:** `src/components/onboarding/FullScreenOnboarding.tsx`

Full viewport takeover, clean click-through:
1. Welcome → 2. Features overview → 3. CRM walkthrough → 4. AI assistant/shortcuts → 5. Done

Uses framer-motion transitions. Skip/Next buttons. Modern, minimal design.

**Modify:** Home page — render `FullScreenOnboarding` when `!me.onboardingCompletedAt`
**Modify/Remove:** `src/components/help/HomeOnboardingChecklist.tsx` — remove proactive display
**Modify:** Settings page — add "Restart onboarding" button

### 4B. Shortcut single source of truth

**Create:** `src/lib/shortcut-definitions.ts`

```typescript
export const SHORTCUT_DEFINITIONS = {
  assistantToggle: { label: "AI Assistant", mac: "Cmd+Space", win: "Ctrl+Space", electron: "CommandOrControl+Space" },
  dictationToggle: { label: "Dictation", mac: "Cmd+Shift+Space", ... },
  meetingToggle: { label: "Meeting Mode", mac: "Cmd+Option+Space", ... },
  commandPalette: { label: "Command Palette", mac: "Cmd+K", ... },
};
```

**Update 4 consumers:**
- `src/overlay/OverlayApp.tsx` DEFAULT_SETTINGS
- `src/components/help/help-content.ts` HELP_SHORTCUTS
- `src/components/onboarding/OnboardingModal.tsx` SHORTCUTS array
- `src/lib/keyboard-shortcuts.ts`

---

## PHASE 5: Bidirectional Slack Bot

### 5A. Slack Events webhook endpoint

**Create:** `packages/server/src/routes/slack-events.ts`

- `POST /api/slack/events` — Slack Events API handler
- URL verification (challenge), request signature verification, event deduplication
- Message/@mention events → `processChatTurn` with `channel: "slack"` → respond via `chat.postMessage`
- When @mentioned in a deal channel: agent can log diligence notes on the deal

### 5B. Bot token storage

Add `slackBotToken` + `slackSigningSecret` to org config (encrypted).

### 5C. Add "slack" channel

**File:** `protocol.ts` — add `"slack"` to channel enum
**File:** `gateway-chat.ts` — Slack-specific system prompt:
- Concise responses, Slack markdown format
- Can log Slack messages as notes on deals when asked
- When @mentioned, check if message relates to an existing deal and offer to update CRM

### 5D. Slack connection UI

**File:** `src/components/connections/ConnectionsContent.tsx`

Show bot status, webhook URL, "Connect Bot" flow with bot scopes.

---

## PHASE 6: Smart Record Creation + Investment Memo Template

### 6A. First-principles agent behavior (system prompt + pill integration)

**File:** `protocol.ts` BASE_SYSTEM_PROMPT

The agent should NEVER assume context. For ANY action:
- **Creating a contact:** Ask for first name, last name, email, company. If company doesn't exist, ask if you should create it. Ask for company details.
- **Creating a deal:** Ask for deal name, amount, status/stage, associated company, associated contacts. Create missing entities.
- **Creating a company:** Ask for name, domain, category, description.
- **Linking entities:** After any creation, proactively link everything (contact↔company, contact↔deal, deal↔company).
- **Running automations:** Confirm which automation and with what parameters.
- **Deleting anything:** Search first, show the exact record, confirm before deleting.
- **Any ambiguous request:** Ask for clarification rather than guessing.

When the agent asks a question via the pill, the response should be structured as a notification (passive, with "Press [shortcut] to respond" and "Respond in chat" options). The agent should NOT just auto-listen after asking.

### 6B. Investment memo automation template

Create a pre-built automation rule (can be created via the agent or manually):
- **Trigger:** `deal.stage_changed` where new status matches configurable final stage (e.g., "IC Review")
- **Actions:**
  1. AI action: read all deal fields, linked contacts (via get_deal_contacts), all deal notes (including meeting summaries, Slack-captured diligence), generate structured investment memo
  2. CRM action: create the memo as a note on the deal
  3. Notify user: "Investment memo for [Company X] has been created"

This uses existing automation infrastructure (AIActionNode + TriggerEventNode + NotifyUserActionNode). The agent can create this automation when asked: "set up an automation to generate an investment memo when a deal reaches IC Review".

### 6C. Improved create handlers

Enhance create_contact/create_deal in tools.ts to return richer confirmation messages showing all linked entities.

---

## Verification

1. `pnpm run typecheck && pnpm run lint && pnpm run build` — must pass after each phase
2. Start dev: `REMOTE_DEBUGGING_PORT=9222 pnpm run dev:all`
3. **Phase 1:** Test each new tool via chat (web search, automation CRUD, search emails, Slack, delete, relationships, search_all)
4. **Phase 2:** Create company/note/meeting → verify events fire → automation triggers
5. **Phase 3:** Create automation with notify action → pill shows notification → "Respond in chat" flow → post-meeting linking prompt
6. **Phase 4:** Fresh login → full-screen onboarding → shortcut labels consistent everywhere
7. **Phase 5:** @mention bot in Slack → CRM responds → "log this as a note on deal X" → note created
8. **Phase 6:** Ask agent to create deal → proactively creates company+contact+deal linked → "set up investment memo automation" → trigger it → memo generated
9. Verify existing 19 tools still work (no regressions)

---

## Implementation Status

### Completed (in `commitCleanup` branch)
- Notification IPC bridge (`onNotification` in preload)
- `PushNotificationPayload` type in shared-overlay/types.ts
- `NotifyUserActionNode` automation node
- Slack events route skeleton (`slack-events.ts`)
- Notifications SSE route skeleton (`notifications.ts`)
- Slack bot config migration (`0033_slack_bot_config.sql`)
- Notification stream main process (`notification-stream.ts`)
- Full-screen onboarding (`FullScreenOnboarding.tsx`, `InteractiveWalkthrough.tsx`)
- Shortcut definitions single source of truth (`shortcut-definitions.ts`)
- `ShortcutRecorder` component
- `use-configured-shortcuts` hook
- Pill notification state + components (notch-pill-state, pill-components)
- OverlayApp notification handling
- Admin routes
- Settings page expansion
- `deal.stage_changed` event firing
- Expanded event guards for companies
- Automation executor `action_notify_user` case
- **Fixed:** `uploadMeetingTranscript` and `processMeeting` were stubs — now real implementations
- **Fixed:** `notifyDataChanged` added to overlay preload IPC bridge
- **Fixed:** `useMeetingSync` in AppLayout.tsx now uses `window.electron.ipcRenderer` correctly

### Remaining (future `feature/agent-expansion` branch)
- Phase 1: 13 new agent tools (web_search, list/create/update/delete/run_automation, search_emails, send_slack_message, delete_record, delete_task, link_contact_to_deal, get_deal_contacts, search_all)
- Phase 1D: System prompt first-principles context gathering guidance
- Phase 1E: TOOL_TITLE_MAP updates for new tools
- Phase 2B: note.created events
- Phase 5C/5D: Slack channel in protocol, Slack connection UI
- Phase 3G: Task reminder scheduler (pg-boss)
- Phase 6B: Investment memo automation template

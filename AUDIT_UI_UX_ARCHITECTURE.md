# BasicsOS Audit: UI/UX + Architecture

Date: 2026-03-04
Scope: Static code audit of frontend (`src/`), desktop overlay flow, and server API composition (`packages/server/src`).

## Executive Summary

BasicsOS has a strong foundation: modular packages, generic object-registry-driven CRM pages, and a clear BFF pattern for AI/voice. The main issues are consistency and complexity drift:

- UX quality is reduced by visible text encoding artifacts and mixed naming.
- Core routes and pages are getting too large and difficult to reason about.
- Several cross-cutting concerns (auth+API key resolution, stream protocol mapping, settings persistence) are still duplicated.
- Migration/versioning hygiene is fragile in real environments with partially-applied schema history.

Overall grade (current): **B-**
Potential with targeted cleanup: **A-**

## Strengths

- Package boundaries are clear (`hub`, `automations`, `voice`, `mcp-viewer`, `server`).
- Generic CRM object model is flexible and avoids per-resource page duplication.
  - [ObjectRegistryProvider.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/providers/ObjectRegistryProvider.tsx)
  - [ObjectListPage.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/components/pages/ObjectListPage.tsx)
- Query/mutation usage is mostly consistent and invalidation-aware.
  - [use-records.ts](/C:/Users/aravb/Desktop/basicsOSnew/src/hooks/use-records.ts)
- Server route ordering is intentionally documented to avoid generic route shadowing.
  - [app.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/app.ts)

## Findings

### High Priority

1. Text encoding corruption in user-facing strings (mojibake)
- Multiple files show corrupted punctuation/shortcut symbols (`⌘`, `—`, etc.).
- This directly hurts trust and perceived quality in visible UI copy.
- Examples:
  - [ChatPage.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/components/pages/ChatPage.tsx)
  - [gateway-chat.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/gateway-chat.ts)
  - [README.md](/C:/Users/aravb/Desktop/basicsOSnew/README.md)

2. Migration robustness is weak for non-pristine databases
- Existing migration chain assumes ideal ordering/state; real DBs hit conflicts (`already exists`, renamed columns).
- This slows onboarding and increases deployment risk.
- Relevant area:
  - [drizzle/](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/drizzle)

3. Cross-cutting auth/key identity model remains conceptually split
- API key exists in both local storage and server DB; this is functional but error-prone for sync and user mental model.
- Current state:
  - [GatewayProvider.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/providers/GatewayProvider.tsx)
  - [SettingsPage.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/components/pages/SettingsPage.tsx)
  - [auth.ts route](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/auth.ts)

### Medium Priority

4. Large page-level components mix too many concerns
- `ObjectListPage` handles route sync, view logic, data fetch, table plumbing, modal orchestration, and layout switching in one file.
- This increases regression risk and slows feature iteration.
- File:
  - [ObjectListPage.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/components/pages/ObjectListPage.tsx)

5. Server gateway-chat stream adapter is complex and brittle
- Manual transformation between OpenAI SSE and AI SDK protocol is non-trivial and difficult to test.
- Needs stronger contract tests and isolation.
- File:
  - [gateway-chat.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/gateway-chat.ts)

6. Naming transition (`sales` -> `crm_users`) is incomplete at domain language level
- Technical aliasing is in place, but conceptual naming still leaks (`salesId`, helper names, comments).
- This hurts maintainability and onboarding.
- Files:
  - [sales.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/db/schema/sales.ts)
  - [constants.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/crm/constants.ts)

7. CRUD route architecture is powerful but fragile
- Generic `/:resource` handlers depend heavily on route order and central constants.
- Works now, but can break silently as routes expand.
- Files:
  - [crm/index.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/crm/index.ts)
  - [app.ts](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/app.ts)

### Low Priority

8. README and public docs lag behind current product direction
- README still references old project naming and setup context.
- File:
  - [README.md](/C:/Users/aravb/Desktop/basicsOSnew/README.md)

9. Sidebar search shortcut UX is hardcoded and platform-literal
- Current display implies Mac symbol in generic context and dispatches synthetic `Ctrl+K` only.
- File:
  - [app-sidebar.tsx](/C:/Users/aravb/Desktop/basicsOSnew/src/components/app-sidebar.tsx)

## UI/UX Observations

- Positive: Clean density, consistent shadcn primitives, clear workspace/navigation framing.
- Positive: Object list/detail flows are coherent and discoverable.
- Needs work:
  - Copy quality and encoding consistency.
  - Better empty/error states in AI and record detail tabs (many placeholders/stubs).
  - Keyboard shortcut labeling by platform.
  - Settings information architecture likely needs a dedicated "AI & Voice" section instead of generic API block.

## Architecture Observations

- Positive: Object registry + schema introspection is a strong extensibility pattern.
- Positive: BFF pattern for voice/chat keeps secrets server-side.
- Needs work:
  - Formal contract tests around stream adapters.
  - Stronger migration idempotency policy.
  - Clear naming policy after `crm_users` rename.
  - Reduce monolith route/page files through feature slices.

## Recommended Plan

### Phase 1 (1 week)
- Normalize encoding and copy strings repo-wide to UTF-8 clean output.
- Add migration policy: all DDL for shared tables should be safe/idempotent when feasible.
- Update README to reflect current app/voice/backend reality.

### Phase 2 (2-3 weeks)
- Split `ObjectListPage` into feature hooks/components:
  - URL state hook
  - view-state orchestration hook
  - table/kanban renderer switch
  - modal coordinator
- Add gateway-chat stream transformation tests (success, malformed chunks, tool-calls, done).

### Phase 3 (3-5 weeks)
- Complete semantic rename pass from `sales*` domain language to `crmUser*` where possible.
- Introduce explicit API-key source-of-truth policy (DB vs local override) with clear UI messaging.
- Add lightweight architecture decision records for:
  - generic CRUD router strategy
  - AI stream protocol mapping
  - voice BFF contract

## Quick Wins

- Fix all mojibake strings first (high UX impact, low effort).
- Keep `resolveSalesWithApiKey` pattern and extend it to all routes still duplicating lookup logic.
- Add a small diagnostics page or panel for voice/chat health (`session`, `apiKey`, `gateway reachability`).

## Risks If Not Addressed

- Perceived quality issues in customer-facing text/UI.
- Increasing fragility in migrations and release operations.
- Rising maintenance cost as generic routing and large component files continue to grow.
- Hard-to-debug AI/voice regressions due to complex stream adaptation and insufficient contract tests.

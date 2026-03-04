# Route Migration Plan: Generic CRUD -> Hybrid Intent API

Date: 2026-03-04
Audience: Backend + frontend + desktop/voice integration owners

## Goal

Migrate from a mostly generic `/:resource` CRUD model to a **hybrid architecture** that keeps generic routes for low-risk internal resources and introduces explicit intent-based routes for core CRM workflows.

Current reference points:
- [CRM router](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/crm/index.ts)
- [App route composition](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/app.ts)
- [CRM resource map](/C:/Users/aravb/Desktop/basicsOSnew/packages/server/src/routes/crm/constants.ts)

---

## Why Change

## Problems with pure generic CRUD

1. Domain intent is hidden
- `PUT /api/deals/:id` can mean stage move, amount update, owner reassignment, etc.
- Hard to enforce business invariants and audit semantics.

2. Validation becomes weak or scattered
- Generic handlers can only validate structural shapes.
- Workflow-specific rules end up duplicated in UI and helper code.

3. Auth and side effects are harder to reason about
- Permission checks and automation triggers differ by action, not by table.
- Generic write endpoints tend to accumulate conditionals.

4. API evolution becomes brittle
- Small domain changes affect many clients because behavior is overloaded behind one endpoint shape.

---

## Benefits of Hybrid Intent API

1. Clear business contracts
- Endpoints describe behavior directly (`/deals/:id/move-stage`, `/tasks/:id/complete`).

2. Better validation and error quality
- Each action has precise schema + actionable errors.

3. Stronger authorization boundaries
- Policy can be action-specific instead of table-generic.

4. Better observability
- Metrics and audit logs track user intent, not just table mutations.

5. Safer client development
- Frontend/desktop/voice call stable action routes with explicit payloads.

6. Backward compatibility remains feasible
- Generic CRUD can remain for internal/admin tables while business flows move first.

---

## Target Architecture

Use three route categories:

1. `Query` routes (read models/projections)
- `GET /api/query/contacts`
- `GET /api/query/deals/:id`
- `GET /api/query/dashboard/pipeline`

2. `Command` routes (mutations with intent)
- `POST /api/command/contacts/:id/merge`
- `POST /api/command/deals/:id/move-stage`
- `POST /api/command/tasks/:id/complete`

3. `Internal generic CRUD` routes (limited scope)
- Keep generic CRUD only for low-risk metadata/config domains:
  - views
  - object config
  - custom field defs

---

## Suggested Initial Endpoint Set

### Contacts
- `POST /api/command/contacts`
- `PATCH /api/command/contacts/:id`
- `POST /api/command/contacts/:id/merge`
- `POST /api/command/contacts/:id/add-note`
- `GET /api/query/contacts`
- `GET /api/query/contacts/:id`

### Deals
- `POST /api/command/deals`
- `PATCH /api/command/deals/:id`
- `POST /api/command/deals/:id/move-stage`
- `POST /api/command/deals/:id/archive`
- `GET /api/query/deals`
- `GET /api/query/deals/:id`

### Tasks
- `POST /api/command/tasks`
- `PATCH /api/command/tasks/:id`
- `POST /api/command/tasks/:id/complete`
- `POST /api/command/tasks/:id/reopen`
- `GET /api/query/tasks`

---

## Mapping from Current Routes

Current generic routes:
- `GET /api/:resource`
- `GET /api/:resource/:id`
- `POST /api/:resource`
- `PUT /api/:resource/:id`
- `DELETE /api/:resource/:id`

Migration mapping (example):

- `GET /api/deals` -> `GET /api/query/deals`
- `PUT /api/deals/:id` (stage updates) -> `POST /api/command/deals/:id/move-stage`
- `PUT /api/tasks/:id` (done_date set) -> `POST /api/command/tasks/:id/complete`
- `POST /api/merge_contacts` -> `POST /api/command/contacts/:id/merge`

---

## Phased Migration Plan

## Phase 0: Foundations (no client breakage)

1. Add new route groups:
- `/api/query/*`
- `/api/command/*`

2. Add shared middleware/utilities:
- request validation wrapper
- action-level authorization helper
- standard error envelope
- command audit logging

3. Keep existing generic routes fully operational.

## Phase 1: Move highest-value commands

Prioritize workflows with most business logic:
1. merge contacts
2. move deal stage
3. complete/reopen tasks
4. add note to record

Frontend + voice/chat tools should switch to new command routes first.

## Phase 2: Read model migration

Move list/detail consumers from `/api/:resource` to `/api/query/*` incrementally:
- object list pages
- detail pages
- dashboard widgets
- assistant tool read paths

## Phase 3: Constrain generic CRUD

1. Mark generic mutations for core resources as deprecated.
2. Restrict generic write routes for business resources in non-dev environments.
3. Keep generic CRUD for internal config entities.

## Phase 4: Cleanup

1. Remove deprecated generic writes for contacts/deals/tasks.
2. Keep read-only generic fallback briefly if needed.
3. Remove old route handlers once telemetry confirms no traffic.

---

## Backward Compatibility Strategy

1. Dual-write period is not required; behavior is command-first.
2. Keep old endpoints as thin adapters that call new command handlers.
3. Add deprecation headers on legacy routes:
- `Deprecation: true`
- `Sunset: <date>`
- `Link: <migration-doc-url>`

4. Instrument legacy route usage to track cutoff readiness.

---

## Validation & Contracts

Per command route:
- strict request schema (zod)
- strict response schema
- explicit domain errors (`invalid_stage_transition`, `task_already_completed`)

This removes ambiguity currently hidden in generic `PUT` handlers.

---

## Security & Authorization

Move from table/resource-based checks to action-based checks:
- `canMoveDealStage(user, deal)`
- `canMergeContacts(user, ids)`
- `canCompleteTask(user, task)`

This is easier to audit and safer than generic mutation permissioning.

---

## Observability

Track command-level metrics:
- `command.deal.move_stage.success`
- `command.task.complete.latency`
- `command.contact.merge.error.invalid_input`

Add structured command logs with:
- actor
- target resource
- action
- outcome
- correlation/request id

---

## Risks and Mitigations

1. Route sprawl
- Mitigate with clear module boundaries (`contacts.command.ts`, `deals.query.ts`).

2. Temporary duplication
- Mitigate with adapter handlers and shared service layer to avoid duplicated logic.

3. Client migration lag
- Mitigate with telemetry + deprecation windows.

---

## Definition of Done

1. All core business mutations use `/api/command/*`.
2. UI + voice/chat call new command routes for those actions.
3. Legacy generic write endpoints for core CRM resources are removed or disabled.
4. Query endpoints cover all read use-cases with stable contracts.
5. Command metrics and deprecation telemetry are in place.

---

## Suggested First PRs

1. Introduce `query/command` route scaffolding + shared middleware.
2. Implement `POST /api/command/deals/:id/move-stage` and migrate kanban UI.
3. Implement `POST /api/command/tasks/:id/complete` and migrate tasks UI.
4. Implement `POST /api/command/contacts/:id/merge` and migrate merge flow.
5. Add deprecation headers to legacy mutation routes.

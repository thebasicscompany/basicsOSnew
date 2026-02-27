# Project Memory: Basics CRM

## Project Overview
Full-stack CRM — React 19 + Vite + TailwindCSS v4 frontend, Hono + Drizzle ORM backend
(packages/server), Better Auth for sessions (cookie-based), pnpm workspaces.

## Active Migration: TanStack Query + Better Auth + Shadcn DataTable
See `docs/IMPLEMENTATION_PLAN_TANSTACK_QUERY.md` for full plan.

### Status (Phases 1–4 complete)
- **Phase 1** ✅ Auth layer without react-admin
- **Phase 2** ✅ API client + TanStack Query hooks
- **Phase 3** ✅ Shadcn DataTable component
- **Phase 4** ✅ ContactsPage, CompaniesPage, DealsPage wired in App.tsx
- **Phase 5** ⬜ Remove react-admin (deferred)

### New Files Created
| File | Purpose |
|------|---------|
| `src/lib/auth.tsx` | `authClient` (better-auth/react), `useSession()`, `ProtectedRoute` |
| `src/lib/api.ts` | `fetchApi`, `fetchApiList` with credentials |
| `src/lib/api/crm.ts` | `getList`, `getOne`, `create`, `update`, `remove` + `ListParams` |
| `src/hooks/use-contacts.ts` | `useContacts`, `useContact`, `useCreateContact`, etc. |
| `src/hooks/use-companies.ts` | `useCompanies`, `useCompany`, etc. |
| `src/hooks/use-deals.ts` | `useDeals`, `useDeal`, etc. |
| `src/components/auth/login-page.tsx` | Standalone login (react-hook-form, no ra-core) |
| `src/components/auth/signup-page.tsx` | First-user signup → /api/signup → auto-login |
| `src/components/auth/start-page.tsx` | Checks session + /api/init → routes accordingly |
| `src/components/data-table.tsx` | Higher-level DataTable wrapping tablecn components |
| `src/components/pages/ContactsPage.tsx` | Contacts list with DataTable |
| `src/components/pages/CompaniesPage.tsx` | Companies list with DataTable |
| `src/components/pages/DealsPage.tsx` | Deals list with DataTable |

### Modified Files
- `src/App.tsx` — completely replaced: BrowserRouter + QueryClientProvider + new routes

## Architecture Notes

### Auth Flow
- `better-auth/react` `createAuthClient` → cookie-based session
- `authClient.useSession()` (hook) for reactive session state
- `ProtectedRoute` redirects to `/` (StartPage) when not authenticated
- StartPage: session check → /contacts (logged in), init check → /sign-up (not init), login form

### API Contract
- GET `/api/:resource?range=[s,e]&sort=field&order=ASC|DESC` → JSON array + Content-Range header
- Resources: contacts, contacts_summary, companies, companies_summary, deals, etc.
- All requests use `credentials: "include"` for cookie auth

### DataTable
- `src/components/tablecn/data-table/data-table.tsx` — base component (takes `table` instance)
- `src/components/data-table.tsx` — new higher-level wrapper (takes `columns` + `data` props)
- `DataTableColumnHeader` uses `label` prop (not `title`)

### Key Patterns
- List hooks: `useContacts(params)` returns `{ data: { data: T[], total: number }, isPending, isError }`
- Mutation hooks: `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()`
- All invalidate `queryClient` on success

## Known Pre-existing Issues
- `@date-fns/tz` and `@dnd-kit/accessibility` missing from node_modules (build fails, dev works)
- These are NOT caused by the migration

## Package Structure
- `packages/server` — Hono API server
- `packages/hub` — HubLayout + HubSidebar (sidebar navigation)
- `packages/shared` — Better Auth restAuthProvider for react-admin (legacy)
- `packages/automations`, `packages/voice`, `packages/mcp-viewer` — separate apps

## Commands
- Dev: `pnpm dev:rest` (server + vite dev)
- Typecheck: `pnpm typecheck`
- Server dev: `pnpm dev:server`

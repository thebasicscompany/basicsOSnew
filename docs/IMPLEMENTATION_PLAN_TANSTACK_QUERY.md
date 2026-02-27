  Implementation Plan: TanStack Query + Better Auth + Shadcn DataTable

**Goal:** Migrate from React Admin to TanStack Query for data fetching. Fix and consolidate auth using Better Auth. Replace tablecn/react-admin tables with shadcn-style DataTable.

---

## 1. Current State Summary

### Auth
- **Server:** Better Auth (`packages/server/src/auth.ts`) with email/password, Drizzle adapter
- **Client:** `createRestAuthProvider` in `@basics-os/shared` wraps Better Auth for react-admin's `AuthProvider` interface
- **Endpoints:** `/api/auth/*` (Better Auth), `/api/me` (identity), `/api/signup` (first-user signup)
- **Session:** Cookie-based, `credentials: "include"` for API calls

### Data
- **Server:** REST API at `/api/:resource` (contacts, companies, deals, etc.)
- **Query params:** `range=[start,end]`, `sort`, `order`, `filter` (filter not fully implemented on server)
- **Response:** `Content-Range` header for total count
- **Client:** `restDataProvider` implements ra-core `DataProvider`; `useDataTableRA` bridges ListContext ↔ TanStack Table

### Tables
- **TablecnListTable** uses `useDataTableRA` + `DataTableRA` + `DataTableToolbar`, `DataTableSortList`, `DataTableViewOptions`
- **Lists:** ContactList, CompanyList, DealList wrap `List` (react-admin) and render `TablecnListTable`

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         App (no react-admin)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  AuthProvider (Better Auth client + /api/me)                              │
│  QueryClientProvider (TanStack Query)                                     │
│  Router                                                                   │
│  ├── /login, /sign-up (public)                                           │
│  ├── / (protected) → HubLayout + HubSidebar                              │
│  │   ├── /contacts → ContactsPage (useContacts + DataTable)              │
│  │   ├── /companies → CompaniesPage (useCompanies + DataTable)           │
│  │   └── /deals → DealsPage (useDeals + DataTable)                        │
│  └── /automations, /voice, /mcp (stubs)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phased Implementation

### Phase 1: Auth Layer (No React Admin)

| Step | Task | Details |
|------|------|---------|
| 1.1 | Create `src/lib/auth.tsx` | `AuthProvider`, `useAuth`, `useSession` using Better Auth client |
| 1.2 | Auth API | `login(email, password)`, `logout()`, `getSession()`, `getIdentity()` (from `/api/me`) |
| 1.3 | Create `ProtectedRoute` | Redirect to `/login` if not authenticated |
| 1.4 | Create `src/lib/auth/login-page.tsx` | Standalone login form (no ra-core Form) |
| 1.5 | Create `src/lib/auth/signup-page.tsx` | Standalone signup (calls `/api/signup`, then login) |
| 1.6 | Create `src/lib/auth/start-page.tsx` | Check `/api/init`; if not initialized → signup, else → login |
| 1.7 | Wire auth in `main.tsx` | Wrap app with `AuthProvider`; use new login/signup/start pages for `/login`, `/sign-up`, `/` |

**Deliverable:** Auth works without react-admin. User can sign up, log in, log out. Protected routes redirect to login.

---

### Phase 2: API Client + TanStack Query

| Step | Task | Details |
|------|------|---------|
| 2.1 | Create `src/lib/api.ts` | `fetchApi(path, options)` with `credentials: "include"`, base URL from `VITE_API_URL` |
| 2.2 | Create `src/lib/api/crm.ts` | Typed functions: `getList(resource, params)`, `getOne`, `create`, `update`, `delete` |
| 2.3 | API params | `getList`: `{ pagination: { page, perPage }, sort: { field, order }, filter?: object }` → `range`, `sort`, `order`, `filter` query params |
| 2.4 | Create `src/hooks/use-contacts.ts` | `useContacts({ page, perPage, sort, filter })` → `useQuery`; `useContact(id)`; `useCreateContact`, `useUpdateContact`, `useDeleteContact` mutations |
| 2.5 | Create `src/hooks/use-companies.ts` | Same pattern for companies (use `companies_summary` resource) |
| 2.6 | Create `src/hooks/use-deals.ts` | Same pattern for deals |
| 2.7 | Server filter support | Add filter handling in `packages/server/src/routes/crm.ts` if not present (e.g. `q`, `company_id`, `category`, `sales_id`) |

**Deliverable:** TanStack Query hooks for contacts, companies, deals. API client with credentials.

---

### Phase 3: Shadcn DataTable

| Step | Task | Details |
|------|------|---------|
| 3.1 | Create `src/components/data-table.tsx` | Shadcn-style `DataTable<TData>` with `columns` + `data` props |
| 3.2 | useReactTable | `getCoreRowModel`, `getPaginationRowModel`, `getSortedRowModel`, `getFilteredRowModel` (client-side for now) |
| 3.3 | Pagination | Prev/Next buttons + page size selector; sync with TanStack Query `page`, `perPage` |
| 3.4 | Sorting | `DataTableColumnHeader` for sortable columns; sync with `sort` from query params |
| 3.5 | Column visibility | `DataTableViewOptions` (Columns dropdown) |
| 3.6 | Row selection | Optional checkbox column + bulk actions bar |
| 3.7 | Row click | Navigate to `/contacts/:id`, `/companies/:id`, `/deals/:id/show` |

**Deliverable:** Reusable `DataTable` component matching shadcn guide. Works with any `columns` + `data`.

---

### Phase 4: Migrate CRM Pages

| Step | Task | Details |
|------|------|---------|
| 4.1 | Create `ContactsPage` | Uses `useContacts`, renders `DataTable` with contact columns; toolbar: Create, Export, Import |
| 4.2 | Create `CompaniesPage` | Uses `useCompanies`, renders `DataTable` with company columns |
| 4.3 | Create `DealsPage` | Uses `useDeals`, renders `DataTable` with deal columns |
| 4.4 | Wire routes | `/contacts` → ContactsPage, `/companies` → CompaniesPage, `/deals` → DealsPage |
| 4.5 | HubSidebar | Already has CRM dropdown with Companies, Contacts, Deals (from prior work) |
| 4.6 | Detail pages | ContactShow, CompanyShow, DealShow — migrate to use `useContact(id)` etc. or keep as separate task |

**Deliverable:** Contacts, Companies, Deals lists work with TanStack Query + shadcn DataTable.

---

### Phase 5: Remove React Admin

| Step | Task | Details |
|------|------|---------|
| 5.1 | Remove CRM/Admin | Replace `App` entry that uses `<CRM />` with new router + AuthProvider + QueryClientProvider |
| 5.2 | Remove ra-core deps | Uninstall `ra-core`, `ra-data-fakerest`, `ra-i18n-polyglot`, etc. |
| 5.3 | Remove tablecn RA adapter | Delete `useDataTableRA`, `DataTableRA`; keep base `DataTable` if useful |
| 5.4 | Cleanup | Remove `restDataProvider`, `authProvider` (ra-core), `Admin`, `Resource`, `List` usage |
| 5.5 | Migrate remaining features | Dashboard, Profile, Settings, Import, Create/Edit forms — migrate incrementally |

**Deliverable:** No react-admin in the app. Lighter bundle, simpler data flow.

---

## 4. File Structure (Proposed)

```
src/
├── lib/
│   ├── api.ts              # fetchApi, base URL
│   ├── api/
│   │   └── crm.ts          # getList, getOne, create, update, delete
│   └── auth.tsx            # AuthProvider, useAuth, useSession
├── hooks/
│   ├── use-contacts.ts
│   ├── use-companies.ts
│   └── use-deals.ts
├── components/
│   ├── data-table.tsx      # Shadcn DataTable (columns + data)
│   ├── auth/
│   │   ├── login-page.tsx
│   │   ├── signup-page.tsx
│   │   └── start-page.tsx
│   └── pages/
│       ├── ContactsPage.tsx
│       ├── CompaniesPage.tsx
│       └── DealsPage.tsx
├── App.tsx                 # Router, AuthProvider, QueryClientProvider
└── main.tsx
```

---

## 5. API Contract (Unchanged)

The server API remains the same. Client adapts.

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/api/me` | — | `{ id, fullName, avatar, administrator }` |
| GET | `/api/init` | — | `{ initialized: boolean }` |
| POST | `/api/signup` | `{ email, password, first_name, last_name }` | `{ id, email }` |
| GET | `/api/contacts_summary` | `range=[s,e]`, `sort`, `order`, `filter` | `Contact[]` + `Content-Range` |
| GET | `/api/contacts_summary/:id` | — | `Contact` |
| POST | `/api/contacts` | body | `Contact` |
| PUT | `/api/contacts/:id` | body | `Contact` |
| DELETE | `/api/contacts/:id` | — | `Contact` |

Same for `companies_summary`, `deals`, etc.

---

## 6. Auth Flow

1. **App load** → `AuthProvider` checks `authClient.getSession()`
2. **Not logged in** → Navigate to `/` (StartPage) → check `/api/init` → signup or login
3. **Login** → `authClient.signIn.email()` → redirect to `/contacts`
4. **API calls** → `credentials: "include"` sends session cookie
5. **Logout** → `authClient.signOut()` → redirect to `/login`

---

## 7. Open Questions

1. **Filter support:** Does the server already support `filter` query param? If not, add for `q`, `company_id`, `category`, `sales_id`, etc.
2. **Create/Edit forms:** Migrate to react-hook-form + TanStack Query mutations, or defer?
3. **Detail pages (Show):** Migrate ContactShow, CompanyShow, DealShow in Phase 4 or Phase 5?
4. **Configuration:** `getConfiguration` / `updateConfiguration` — create `useConfiguration` hook?
5. **Electron:** Ensure `VITE_API_URL` and auth redirects work in Electron (e.g. `http://localhost:3001`).

---

## 8. Estimated Effort

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Auth | 1–2 days | Straightforward; Better Auth client already used |
| Phase 2: API + TanStack Query | 1–2 days | API client + hooks; server filter if needed |
| Phase 3: Shadcn DataTable | 1 day | Follow shadcn guide; adapt for server pagination/sort |
| Phase 4: Migrate pages | 1–2 days | Three list pages + routing |
| Phase 5: Remove React Admin | 1–2 days | Cleanup + migrate remaining (Dashboard, Profile, etc.) |

**Total:** ~5–9 days

---

## 9. Success Criteria

- [ ] User can sign up, log in, log out without react-admin
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Contacts, Companies, Deals lists render with shadcn DataTable
- [ ] Data fetched via TanStack Query; pagination and sort work
- [ ] No `ra-core` dependency in the app
- [ ] Hub sidebar navigates to CRM tables correctly

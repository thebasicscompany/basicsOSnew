# Implementation Plan: Postgres + Better Auth Migration

**Goal:** Replace Supabase with Docker Postgres + Better Auth. Users who clone atomic-crm get a simple, provider-agnostic stack. Swapping database = changing `DATABASE_URL`.

---

## Phase 0: Prerequisites & Decisions

### Stack Summary
| Component | Current | Target |
|-----------|---------|--------|
| Auth | Supabase Auth | Better Auth |
| Database | Supabase Postgres | Plain Postgres (Docker or any provider) |
| Migrations | Supabase migrations | Drizzle |
| Storage | Supabase Storage | URL-only (user brings own if needed) |
| Data access | Supabase client (browser) | Backend API (required: browser can't connect to DB directly) |

### Why a Backend is Required
The frontend cannot connect to Postgres directly (credentials would be exposed). We need a backend server that:
- Connects to Postgres via Drizzle
- Runs Better Auth
- Exposes CRM data via REST (or similar) for the frontend dataProvider

---

## Phase 1: Project Structure & Docker

### 1.1 Add Backend Package
```
atomic-crm/
├── packages/
│   ├── api/          # existing (assistant) - will be extended or merged
│   └── server/       # NEW: main backend (auth + CRM CRUD)
├── docker-compose.yml
└── ...
```

### 1.2 Docker Compose
```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16  # or ankane/pgvector; needed for context_embeddings
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: crm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 1.3 Environment Variables
```env
# .env (root or packages/server)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:5173  # or backend URL for auth callbacks
```

---

## Phase 2: Drizzle Schema & Migrations

### 2.1 Install Drizzle
```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### 2.2 Schema Layout
Create `packages/server/src/db/schema/`:

| File | Contents |
|------|----------|
| `organizations.ts` | `id`, `name`, `created_at` |
| `users.ts` | Better Auth user table (or use Better Auth's default) |
| `sales.ts` | `id`, `first_name`, `last_name`, `email`, `user_id`, `organization_id`, `administrator`, `avatar` (URL), `disabled`, `basics_api_key` |
| `contacts.ts` | contacts table (snake_case columns from current schema) |
| `companies.ts` | companies table |
| `deals.ts` | deals table |
| `contact_notes.ts` | contact_notes table |
| `deal_notes.ts` | deal_notes table |
| `tasks.ts` | tasks table |
| `tags.ts` | tags table |
| `configuration.ts` | singleton config |
| `context_embeddings.ts` | for assistant RAG (requires pgvector) |
| `automation_rules.ts` | automation rules |
| `invites.ts` | `id`, `token`, `organization_id`, `email` (optional), `expires_at`, `created_at` |
| `favicons_excluded_domains.ts` | `id`, `domain` (for avatar/logo auto-fetch exclusions) |

### 2.3 Key Schema Changes from Supabase

1. **sales.user_id**: References `user.id` (Better Auth user table), not `auth.users.id`.

2. **organizations**: New table. First user creates org on signup. All `sales` rows have `organization_id`. For future: contacts, companies, deals could be scoped by `organization_id` (or we keep current model where sales implies org via first user).

3. **Remove RLS**: No Supabase RLS. Authorization happens in the backend (e.g. "user can only access data in their org").

4. **avatar / logo**: Store as `text` (URL) or `jsonb` with `{ src: string }`. No file upload to Supabase Storage.

5. **attachments**: Keep `jsonb[]` or `jsonb` with `[{ url, name, type }]`. URLs only.

6. **init_state**: Replace with `SELECT EXISTS(SELECT 1 FROM sales LIMIT 1)` or `organizations` count. No separate view.

7. **Triggers to migrate**:
   - `handle_new_user` / `handle_update_user`: Logic moves to backend (Better Auth hooks or signup handler).
   - `set_sales_id_default`: Backend sets `sales_id` on insert from session.
   - `evaluate_automation_rules_on_deal` / `evaluate_automation_rules_on_contact`: Keep as Postgres functions, call from Drizzle or raw SQL.

8. **Views**: `companies_summary`, `contacts_summary` — recreate in Drizzle migrations or as SQL in migration files.

9. **merge_contacts**: Keep as Postgres function. Backend exposes an endpoint that calls it.

10. **match_context_embeddings**: Keep as Postgres function (pgvector). Backend calls it for assistant.

11. **set_sales_id_default trigger**: Currently uses `auth.uid()`. Replace with backend logic: on insert, backend sets `sales_id` from session's user (lookup sales.id by user_id).

12. **handle_contact_saved / handle_company_saved**: Auto-fetch avatar/logo from Gravatar/favicon. Requires `http` extension. Can keep as triggers or move to backend (optional).

13. **favicons_excluded_domains**: Small table for avatar fetch exclusions. Include in schema.

14. **get_user_id_by_email**: References `auth.users`. Remove or replace with lookup in Better Auth user table.

### 2.4 Drizzle Config
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 2.5 Migration Strategy
- Generate initial migration from schema: `pnpm drizzle-kit generate`
- Review and adjust SQL if needed (e.g. for functions, views)
- Run: `pnpm drizzle-kit migrate` (or `db push` for dev)

---

## Phase 3: Better Auth Setup

### 3.1 Install
```bash
pnpm add better-auth
```

### 3.2 Configuration
```typescript
// packages/server/src/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(pool, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      organizationId: { type: "string", required: false },
    },
  },
  session: { cookieCache: { enabled: true } },
  // Invite: custom table + route
  // Or use Better Auth's organization plugin if it fits
});
```

### 3.3 Invite Flow (Custom URL)
- Table: `invites` with `token`, `organization_id`, `email` (optional), `expires_at`
- Route: `GET /invite/:token` → redirects to signup with token in query
- On signup: validate token, create user, add to org, create sales row, mark invite used

### 3.4 First User = Org Creator
- On first signup (no orgs exist): create org, set user as admin, create sales row with `administrator: true`
- On subsequent signup: require invite token, or add to existing org via invite

---

## Phase 4: Backend API (packages/server)

### 4.1 Framework
Use Hono (already in packages/api). Extend or create new server that:
- Mounts Better Auth routes
- Exposes CRM REST endpoints

### 4.2 CRM Endpoints (ra-core compatible)
The frontend uses `ra-core` dataProvider interface. We need endpoints that match:

| Method | Path pattern | Purpose |
|--------|--------------|---------|
| GET | /api/:resource | getList |
| GET | /api/:resource/:id | getOne |
| POST | /api/:resource | create |
| PUT | /api/:resource/:id | update |
| DELETE | /api/:resource/:id | delete |
| GET | /api/:resource?filter=...&sort=...&range=... | getList with params |

Resources: `contacts`, `companies`, `deals`, `contact_notes`, `deal_notes`, `tasks`, `sales`, `tags`, `configuration`, `automation_rules`.

Plus custom:
- `POST /api/merge_contacts` (body: `{ loserId, winnerId }`)
- `GET /api/configuration` (or part of configuration resource)
- `POST /api/signup` (first user)
- `PATCH /api/sales/:id/password` (trigger password reset email via Better Auth)

### 4.3 Auth Middleware
- All CRM endpoints require valid session (Better Auth session cookie or Bearer token)
- Resolve `user_id` and `organization_id` from session
- Filter all queries by `organization_id` (when we add it to tables) or by `sales_id` in user's org

### 4.4 Views & Custom Queries
- `companies_summary`, `contacts_summary`: Implement as backend queries (joins) or recreate as DB views in migrations

---

## Phase 5: Frontend Changes

### 5.1 Remove Supabase
- Remove `@supabase/supabase-js`, `ra-supabase-core`
- Remove `supabase/` folder (config, migrations — replaced by Drizzle)
- Remove `auth-callback.html` (no Supabase OAuth)
- Remove `VITE_SUPABASE_URL`, `VITE_SB_PUBLISHABLE_KEY` from env

### 5.2 New Auth Provider
Create `authProvider` that uses Better Auth client:
- `login`: `authClient.signIn.email()`
- `logout`: `authClient.signOut()`
- `checkAuth`: verify session exists
- `getIdentity`: fetch current user from `/api/me` or similar

### 5.3 New Data Provider
Create `restDataProvider` (or use `ra-data-simple-rest` / custom) that calls `http://localhost:3xxx/api` (or `VITE_API_URL`).

- Base URL from `VITE_API_URL`
- Send session cookie (same-origin) or Bearer token
- Map ra-core params to REST: filter, sort, pagination

### 5.4 Storage / Upload Handling
- **Avatars, logos**: Change `FileInput` / `ImageEditorField` to accept URL input. Optionally: add "Upload" that POSTs to backend, backend returns URL (user configures storage in backend env).
- **Attachments**: Same. Store `{ url, name, type }`. If user selects file, POST to `/api/upload` → returns URL. Backend can write to local disk or S3 based on config.

For MVP: allow pasting URL only. Upload endpoint can be added later.

### 5.5 Signup Flow
- `SignupPage` calls `POST /api/signup` with `{ email, password, first_name, last_name }`
- Backend: if no orgs, create org + user + sales (admin); else require invite token
- After signup, redirect to login or auto-login

### 5.6 Invite Flow
- Admin generates invite link: `https://app.example.com/invite/abc123`
- New user visits, signs up with email/password
- Backend validates token, creates user + sales row in same org

---

## Phase 6: Assistant Integration

### 6.1 packages/api (Assistant)
- Currently uses Supabase for: auth (JWT), sales lookup, context_embeddings
- Change to: validate session via Better Auth (shared secret or JWT), read from same Postgres
- Or: merge assistant into packages/server, share DB connection

### 6.2 Context Embeddings
- Table stays in Postgres (pgvector)
- `match_context_embeddings` function stays
- Assistant API uses Drizzle or raw SQL to call it

### 6.3 basicsAdmin Call
- Unchanged: frontend sends `BASICOS_API_KEY` to assistant, assistant calls basicsAdmin for embeddings/chat

---

## Phase 7: Migration Execution Order

| Step | Task | Status |
|------|------|--------|
| 1 | Create `packages/server`, add Drizzle, Docker Compose | Done |
| 2 | Define Drizzle schema (all tables) | Done |
| 3 | Generate and run initial migration | Pending |
| 4 | Add Better Auth, configure with Drizzle adapter | Done |
| 5 | Implement auth routes (login, logout, signup, invite) | Done (signup, /me; invite TBD) |
| 6 | Implement CRM REST endpoints (start with contacts, companies, deals) | Done |
| 7 | Implement custom methods (mergeContacts, getConfiguration, etc.) | Pending |
| 8 | Create new authProvider (Better Auth client) | Pending |
| 9 | Create new dataProvider (REST client) | Pending |
| 10 | Update frontend to use new providers | Pending |
| 11 | Remove Supabase, update env, README | Pending |
| 12 | Handle storage: URL-only for avatars/logos/attachments | Pending |
| 13 | Migrate assistant (packages/api) to use new DB/auth | Done (merged into packages/server) |
| 14 | Update makefile, README, dev scripts | Pending |

---

## Phase 8: File-by-File Checklist

### New Files
- [x] `docker-compose.yml`
- [x] `packages/server/package.json`
- [x] `packages/server/src/index.ts`
- [x] `packages/server/src/db/schema/*.ts`
- [x] `packages/server/src/db/client.ts`
- [x] `packages/server/drizzle.config.ts`
- [x] `packages/server/src/auth.ts`
- [x] `packages/server/src/routes/auth.ts` (signup, /me)
- [x] `packages/server/src/routes/crm.ts` (CRM resources - createCrmRoutes)
- [x] `packages/server/src/middleware/auth.ts`
- [x] `packages/server/src/routes/assistant.ts` (Better Auth session, Drizzle tools)
- [ ] `src/providers/rest/authProvider.ts`
- [ ] `src/providers/rest/dataProvider.ts`

### Modified Files
- [ ] `package.json` (workspace, scripts)
- [ ] `src/App.tsx` or CRM root (use new providers)
- [ ] `src/components/atomic-crm/root/CRM.tsx` (provider wiring)
- [ ] `src/components/atomic-crm/login/SignupPage.tsx`
- [ ] `src/components/atomic-crm/login/StartPage.tsx`
- [ ] `packages/api/src/*` (assistant auth + DB)
- [ ] `makefile` (start server, migrate)
- [ ] `README.md`

### Removed / Deprecated
- [ ] `src/components/atomic-crm/providers/supabase/*`
- [ ] `supabase/` folder (keep for reference during migration, remove after)
- [ ] `public/auth-callback.html`
- [ ] Supabase-related env vars

---

## Phase 9: Testing & Validation

1. **Fresh install**: `docker compose up -d`, `pnpm run migrate`, `pnpm dev` → first user signup works
2. **Invite**: Create invite link, second user signs up, both in same org
3. **CRUD**: Create contact, company, deal, note, task
4. **Assistant**: Add Basics API key, chat works
5. **Provider swap**: Change `DATABASE_URL` to Neon/Supabase Postgres, run migrations → works

---

## Appendix A: Drizzle Schema Sketch (sales, organizations)

```typescript
// organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// sales (links to Better Auth user)
export const sales = pgTable("sales", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Better Auth user.id
  organizationId: uuid("organization_id").references(() => organizations.id),
  administrator: boolean("administrator").notNull(),
  avatar: jsonb("avatar"), // { src: string }
  disabled: boolean("disabled").default(false),
  basicsApiKey: varchar("basics_api_key", { length: 255 }),
});
```

---

## Appendix B: Better Auth + Organization

Better Auth has an [organization plugin](https://www.better-auth.com/docs/plugins/organization). Evaluate if it fits:
- Creates `organization` and `member` tables
- Handles invite flow
- May simplify our custom invite implementation

---

## Appendix C: Storage Options (Future)

For uploads, backend can support:
1. **Local disk**: `UPLOAD_DIR=/tmp/uploads`, serve at `/uploads/:filename`
2. **S3**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_REGION`
3. **Configurable**: Single `UPLOAD_PROVIDER=local|s3` env var

Return URL to frontend, store in DB.

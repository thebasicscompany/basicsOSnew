# BasicsOS

A CRM hub built with React, Vite, and a Node/Hono REST API. Contact/deal/company management, task tracking, notes, AI chat, automations, voice (placeholder), and MCP viewer. Data is backed by PostgreSQL via Drizzle; auth uses Better Auth.

## Quick Start

**Prerequisites:** Node 22+, pnpm, Docker

```sh
# 1. Clone and install
git clone https://github.com/thebasicscompany/basicsOSnew.git
cd basicsOSnew
pnpm install

# 2. Start Postgres
docker compose up -d

# 3. Configure and migrate
cd packages/server && cp .env.example .env
# Edit .env: set BETTER_AUTH_SECRET (min 32 chars). Example: openssl rand -base64 32
pnpm db:migrate
pnpm db:seed   # creates admin@example.com / admin123 + demo data

# 4. Run the app (from repo root)
cd ../..
pnpm run dev:rest
```

Open **http://localhost:5173**. Log in with the seed user. (For Electron dev, use `pnpm dev:all`; the app uses the Vite proxy so auth cookies work.)

| Email | Password |
|-------|----------|
| `admin@example.com` | `admin123` |

---

## Features

- 📇 **Organize Contacts**: Keep all your contacts in one easily accessible place.
- ⏰ **Create Tasks & Set Reminders**: Never miss a follow-up or deadline.
- 📝 **Take Notes**: Capture important details and insights effortlessly.
- 📊 **Manage Deals**: Visualize and track your sales pipeline in a Kanban board.
- 🤖 **AI Chat & Assistant**: Built-in AI chat and streaming assistant via the server.
- 🔄 **Automations**: Workflow builder with triggers and actions (email, AI, CRM, Slack, Gmail).
- 🔐 **Authentication**: Email/password signup and login via Better Auth.
- 📜 **Track Activity History**: View interactions in aggregated activity logs.
- 🔗 **Integrate via API**: REST API for CRM resources.
- 🖥️ **Electron App**: Desktop build with overlay support.
- 🛠️ **Customize Everything**: Add custom fields, object config, views, and themes.

## Setup Details

### Environment

`packages/server/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5435/crm` | Postgres connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Min 32 chars. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | No | `http://localhost:5173` | Frontend URL (for auth redirects) |
| `PORT` | No | `3001` | API server port |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev:rest` | Start frontend + API (recommended) |
| `pnpm run dev:server` | Start API only |
| `pnpm run dev` | Start frontend only |
| `pnpm run dev:all` | Start API + Electron app |
| `pnpm run dev:electron` | Start Electron app only (with API proxy) |
| `pnpm run build` | Build frontend |
| `pnpm run build:electron` | Build Electron app |

### Database (Drizzle)

```sh
cd packages/server
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema (dev)
pnpm db:seed       # Seed demo data
pnpm db:studio     # Drizzle Studio
```

## Testing & Code Quality

```sh
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run lint:apply
pnpm run prettier:apply
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router v7, TanStack Query
- **UI**: Shadcn UI, Radix UI, Tailwind CSS v4
- **Backend**: Node + Hono, Drizzle ORM, PostgreSQL, Better Auth
- **Packages**: `@basics-os/server`, `@basics-os/hub`, `@basics-os/automations`, `@basics-os/voice`, `@basics-os/mcp-viewer`, `@basics-os/shared`

## License

MIT License. See [LICENSE.md](./LICENSE.md).

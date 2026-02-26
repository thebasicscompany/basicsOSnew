# Basics CRM

A full-featured CRM built with React, shadcn-admin-kit, and Postgres.

<https://github.com/user-attachments/assets/0d7554b5-41c6-bcc9-a76214fc5c99>

Basics CRM is free and open-source. You can test it online at <https://marmelab.com/atomic-crm-demo>.

## Quick Start

Get up and running in under 5 minutes.

**Prerequisites:** Node 22+, pnpm, Docker

```sh
# 1. Clone and install
git clone https://github.com/[username]/atomic-crm.git
cd atomic-crm
pnpm install

# 2. Start Postgres
docker compose up -d

# 3. Configure and migrate
cd packages/server && cp .env.example .env
# Edit .env: set BETTER_AUTH_SECRET (min 32 chars). Example: openssl rand -base64 32
pnpm db:migrate
pnpm db:seed

# 4. Run the app (from repo root)
cd ../..
pnpm run dev:rest
```

Open **http://localhost:5173** and log in with `admin@example.com` / `admin123`.

---

## Features

- 📇 **Organize Contacts**: Keep all your contacts in one easily accessible place.
- ⏰ **Create Tasks & Set Reminders**: Never miss a follow-up or deadline.
- 📝 **Take Notes**: Capture important details and insights effortlessly.
- ✉️ **Capture Emails**: CC Basics CRM to automatically save communications as notes.
- 📊 **Manage Deals**: Visualize and track your sales pipeline in a Kanban board.
- 🔄 **Import & Export Data**: Easily transfer contacts in and out of the system.
- 🔐 **Authentication**: Email/password signup and login via Better Auth.
- 📜 **Track Activity History**: View all interactions in aggregated activity logs.
- 🔗 **Integrate via API**: Connect seamlessly with other systems using our REST API.
- 🛠️ **Customize Everything**: Add custom fields, change the theme, and replace any component to fit your needs.

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
| `pnpm run dev` | Start frontend only (Supabase mode) |
| `make docker-up` | Start Postgres container |
| `make db-migrate` | Run database migrations |
| `make db-seed` | Seed demo data |
| `make start-rest` | Alias for `pnpm run dev:rest` |

### Import Sample Data

After logging in, go to **Contacts → Import CSV** and select `test-data/contacts.csv` to import 500 sample contacts and companies.

## Optional: Supabase Mode

For the original Supabase-backed setup:

```sh
npx supabase start
make start
```

See the [doc/](doc/) directory for Supabase configuration, SSO, and more.

## Optional: AI Assistant

The AI assistant requires a separate API:

```sh
cd packages/api && cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
pnpm run dev
```

## Testing

```sh
pnpm test
```

## License

MIT License, courtesy of [Marmelab](https://marmelab.com). See [LICENSE.md](./LICENSE.md).

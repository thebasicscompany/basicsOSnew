<p align="center">
  <img src="./public/logos/basicos-wordmark-basics-white.png" width="220" alt="BasicsOS" />
</p>

<h3 align="center">Open-Source CRM Desktop App for Modern Teams</h3>

<p align="center">
  Contacts, companies, deals, tasks, notes, AI chat, and automations in one desktop app.<br/>
  <strong>Open-source core. Commercial services available.</strong>
</p>

<p align="center">
  <a href="https://www.basicsos.com/">Website</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/frontend-React%2019-61DAFB?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/backend-Hono%20%2B%20Drizzle-0EA5E9?style=flat-square" alt="Hono + Drizzle" />
  <img src="https://img.shields.io/badge/database-PostgreSQL-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" alt="AGPL-3.0" />
  <img src="https://img.shields.io/badge/version-0.1.0-green?style=flat-square" alt="v0.1.0" />
</p>

---

## What is BasicsOS?

BasicsOS is an Electron-first CRM desktop app built with React, Vite, and a Node/Hono REST API. It supports configurable CRM objects, custom fields, generic list/detail views, workflow automations, and AI-assisted operations.

This repository is the open-source codebase. Commercial offerings may include hosted infrastructure, support SLAs, and managed services.

---

## Product Screenshots

Add product visuals here when ready.

```md
![Dashboard](./public/screenshots/dashboard.png)
![Deals Pipeline](./public/screenshots/deals-pipeline.png)
![AI Chat](./public/screenshots/ai-chat.png)
```

---

## Core Features

- Configurable CRM objects and custom fields
- Contacts, companies, deals, tasks, notes, and activity tracking
- Saved views, filters, and sorts across list/detail experiences
- Built-in AI chat and streaming assistant
- Workflow automation builder (email, AI, CRM, Slack, Gmail)
- REST API server with Hono + Drizzle + PostgreSQL
- Electron desktop app experience

---

## Quick Start

### Prerequisites

You must have all of the following installed before running BasicsOS locally:

- Node.js `22+` (LTS recommended)
- pnpm `10+`
- Docker Desktop (or Docker Engine + Compose plugin)
- Git

Quick checks:

```sh
node -v
pnpm -v
docker --version
docker compose version
git --version
```

If any command fails, install that dependency first.

### 1. Clone and install

```sh
git clone https://github.com/thebasicscompany/basicsOSnew.git
cd basicsOSnew
pnpm install
```

### 2. Start Postgres

```sh
docker compose up -d
```

### 3. Configure backend and migrate

```sh
cd packages/server
cp .env.example .env
# Set BETTER_AUTH_SECRET (min 32 chars), e.g. openssl rand -base64 32
pnpm db:migrate
pnpm db:seed   # Creates admin@example.com / admin123 — dev only, blocked in production
cd ../..
```

### 4. Run the desktop app + API

```sh
pnpm run dev:all
```

The Electron app will open. Log in with:

- Email: `admin@example.com`
- Password: `admin123`

---

## Environment Variables

`packages/server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5435/crm` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | N/A | Better Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | No | `http://localhost:5173` | Auth callback base URL (see Production) |
| `BASICOS_API_URL` | No | `https://api.basicsos.com` | AI gateway URL (chat, embeddings, voice) |
| `ALLOWED_ORIGINS` | No | (empty) | Comma-separated origins for CORS + Better Auth (e.g. `https://api.acme.com`) |
| `API_KEY_ENCRYPTION_KEY` | Prod | N/A | 32-byte base64/hex key for encrypting user API keys. Required for production. |
| `PORT` | No | `3001` | API server port |

*For self-hosting: set `BASICOS_API_URL` to your gateway. Users add their API key in Settings.*

---

## Production Deployment

### API server

1. **Run migrations before starting the server:**
   ```sh
   cd packages/server && pnpm db:migrate
   ```

2. **Do not run `pnpm db:seed` in production.** Seed creates a default admin and is blocked when `NODE_ENV=production`. Create users via signup or your own provisioning.

3. **Required production env vars:**
   - `DATABASE_URL` – Production Postgres (use SSL, strong credentials).
   - `BETTER_AUTH_SECRET` – Min 32 chars; use `openssl rand -base64 32`.
   - `BETTER_AUTH_URL` – Your production API base URL (e.g. `https://api.yourcompany.com`).
   - `ALLOWED_ORIGINS` – Origins for auth callbacks and CORS (e.g. your API URL).
   - `API_KEY_ENCRYPTION_KEY` – 32-byte key for encrypting stored API keys.

### Docker

A Dockerfile is provided for the API server. Build and run:

```sh
docker build -t basicsos-server .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://api.yourcompany.com \
  -e ALLOWED_ORIGINS=https://api.yourcompany.com \
  basicsos-server
```

Use `docker compose` with the included `docker-compose.yml` for Postgres; add a `server` service that uses this image.

### Electron app (production API URL)

The desktop app connects to the API using `BASICOS_API_URL` or `VITE_API_URL`. For packaged builds:

- **Same machine:** If the API runs on localhost, the default `http://localhost:3001` works.
- **Remote API:** Set `BASICOS_API_URL` when launching the app:
  ```sh
  # macOS / Linux
  BASICOS_API_URL=https://api.yourcompany.com open "Basics Hub.app"
  # Or create a wrapper script that exports the env and launches the app
  ```
  On Windows, set the env in a shortcut or batch file before starting the app.

- **Build-time:** For a fixed API URL in the packaged app, set `VITE_API_URL` during the Electron build so it gets baked into the renderer. The main process reads `process.env.BASICOS_API_URL` at runtime, which is empty in a packaged app unless set at launch.

---

## API Keys and BYOK

The app uses the Basics API gateway. **We recommend a Basics API key** — one key for chat, embeddings, and voice. Get one at [basicsos.com/dashboard](https://basicsos.com/dashboard) and add it in Settings.

To run against your own gateway (self-hosting):

1. Set `BASICOS_API_URL` in `packages/server/.env` to your gateway URL.
2. Users add their API key in Settings as usual. Your gateway must accept the same key format (`bos_live_sk_` / `bos_test_sk_`) or you'll need to adjust validation in `GatewayProvider` and `SettingsPage`.

You can also use your own provider keys (OpenAI, Anthropic, Gemini, Deepgram) with our gateway by passing `x-byok-provider` and `x-byok-api-key` headers when calling the API—you still get observability, logging, and unified usage tracking. See the [gateway API documentation](https://basicsos.com/api-docs) for details. (CRM Settings accepts Basics key only; BYOK via headers is for direct API integrations.)

---

## Monorepo Structure

```text
packages/
  server/
  hub/
  automations/
  voice/
  mcp-viewer/
  shared/
src/
  components/
  hooks/
  providers/
```

---

## Common Commands

```sh
pnpm run dev:all       # desktop app + API (recommended)
pnpm run dev:electron  # Electron only
pnpm run dev:server    # API only
pnpm run dev:rest      # web frontend + API (debug/alternate workflow)
pnpm run dev           # web frontend only
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run build
```

Database commands:

```sh
cd packages/server
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
pnpm db:studio
```

---

## Troubleshooting

- Ensure Docker is running and Postgres container is healthy.
- Confirm ports are free: `3001` (API), `5435` (Postgres), and `5173` if using web debug mode.
- If auth fails, verify `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in `packages/server/.env`.

---

## OSS and Commercial

BasicsOS is open-source under AGPL-3.0 in this repository.

Commercial offerings can include hosted deployments, managed operations, compliance support, and enterprise service layers on top of the OSS core.

---

## Contributing

Contributions are welcome. See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md).

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

AGPL-3.0. See [`LICENSE.md`](./LICENSE.md).

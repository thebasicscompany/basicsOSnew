# Basics CRM API

Standalone API for the AI assistant and context layer. Deployable anywhere (Railway, Fly.io, Vercel, self-hosted).

## Setup

1. Copy `.env.example` to `.env`
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from `supabase start` or your project)
3. Set `BASICOS_API_URL` if using a custom basicsAdmin instance (default: https://api.basics.so)

## Run

```bash
npm run dev
```

Listens on http://localhost:3001 by default.

## Routes

- `GET /health` — Liveness check
- `POST /assistant` — RAG-powered chat. Requires `Authorization: Bearer <Supabase JWT>` and body `{ message: string, messages?: [...] }`

## DB Adapter

Default: Supabase. Implement `ContextDbAdapter` for other databases (Neon, raw pg, etc.).

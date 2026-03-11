CREATE TABLE IF NOT EXISTS "agent_cron_jobs" (
  "id" BIGSERIAL PRIMARY KEY,
  "organization_id" UUID REFERENCES "organizations"("id") ON DELETE CASCADE,
  "crm_user_id" BIGINT NOT NULL REFERENCES "crm_users"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "schedule" VARCHAR(100) NOT NULL,
  "prompt" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "last_run_at" TIMESTAMPTZ,
  "last_run_status" VARCHAR(32),
  "last_run_result" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

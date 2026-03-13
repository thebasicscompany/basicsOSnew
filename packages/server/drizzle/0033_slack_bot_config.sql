-- Add Slack bot config columns to org_ai_config for Events API
ALTER TABLE "org_ai_config" ADD COLUMN IF NOT EXISTS "slack_bot_token_enc" text;
ALTER TABLE "org_ai_config" ADD COLUMN IF NOT EXISTS "slack_signing_secret" varchar(64);
ALTER TABLE "org_ai_config" ADD COLUMN IF NOT EXISTS "slack_team_id" varchar(32);

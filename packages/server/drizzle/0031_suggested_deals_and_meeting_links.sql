-- suggested_deals table
CREATE TABLE IF NOT EXISTS "suggested_deals" (
  "id" bigserial PRIMARY KEY,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "source_email_id" bigint,
  "gmail_thread_id" varchar(64),
  "deal_name" varchar(512),
  "founder_name" varchar(255),
  "founder_email" varchar(512),
  "company_name" varchar(255),
  "company_domain" varchar(255),
  "company_category" varchar(255),
  "description" text,
  "score" smallint NOT NULL DEFAULT 0,
  "signals" jsonb NOT NULL DEFAULT '{"emailCount":0,"threadCount":0,"isBidirectional":false,"isIntroEmail":false,"hasFounderSignals":false,"confidence":0}',
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "reviewed_at" timestamp with time zone,
  "created_deal_id" bigint,
  "created_contact_id" bigint,
  "created_company_id" bigint,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "suggested_deals_org_thread_idx" ON "suggested_deals" ("organization_id", "gmail_thread_id");
CREATE INDEX IF NOT EXISTS "suggested_deals_org_status_score_idx" ON "suggested_deals" ("organization_id", "status", "score");

-- meeting_links table
CREATE TABLE IF NOT EXISTS "meeting_links" (
  "id" bigserial PRIMARY KEY,
  "meeting_id" bigint NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "contact_id" bigint REFERENCES "contacts"("id") ON DELETE CASCADE,
  "company_id" bigint REFERENCES "companies"("id") ON DELETE CASCADE,
  "deal_id" bigint REFERENCES "deals"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "meeting_links_meeting_idx" ON "meeting_links" ("meeting_id");
CREATE INDEX IF NOT EXISTS "meeting_links_contact_idx" ON "meeting_links" ("contact_id");
CREATE INDEX IF NOT EXISTS "meeting_links_company_idx" ON "meeting_links" ("company_id");
CREATE INDEX IF NOT EXISTS "meeting_links_deal_idx" ON "meeting_links" ("deal_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_links_meeting_contact_idx" ON "meeting_links" ("meeting_id", "contact_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_links_meeting_company_idx" ON "meeting_links" ("meeting_id", "company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_links_meeting_deal_idx" ON "meeting_links" ("meeting_id", "deal_id");

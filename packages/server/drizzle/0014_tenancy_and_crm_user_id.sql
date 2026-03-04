CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- 1) Rename legacy sales_id -> crm_user_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='sales_id') THEN
    ALTER TABLE "companies" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='sales_id') THEN
    ALTER TABLE "contacts" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deals' AND column_name='sales_id') THEN
    ALTER TABLE "deals" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='sales_id') THEN
    ALTER TABLE "tasks" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_notes' AND column_name='sales_id') THEN
    ALTER TABLE "contact_notes" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='deal_notes' AND column_name='sales_id') THEN
    ALTER TABLE "deal_notes" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='context_embeddings' AND column_name='sales_id') THEN
    ALTER TABLE "context_embeddings" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_rules' AND column_name='sales_id') THEN
    ALTER TABLE "automation_rules" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_runs' AND column_name='sales_id') THEN
    ALTER TABLE "automation_runs" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='record_favorites' AND column_name='sales_id') THEN
    ALTER TABLE "record_favorites" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='views' AND column_name='sales_id') THEN
    ALTER TABLE "views" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_threads' AND column_name='sales_id') THEN
    ALTER TABLE "ai_threads" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_memory_items' AND column_name='sales_id') THEN
    ALTER TABLE "ai_memory_items" RENAME COLUMN "sales_id" TO "crm_user_id";
  END IF;
END $$;
--> statement-breakpoint

-- 2) Add organization scoping columns (additive, safe)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "contact_notes" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "deal_notes" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "automation_rules" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "automation_runs" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "context_embeddings" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "custom_field_defs" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "object_config" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "object_attribute_overrides" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "record_favorites" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
ALTER TABLE "views" ADD COLUMN IF NOT EXISTS "organization_id" uuid;
--> statement-breakpoint

-- 3) Backfill organization_id from crm_users where possible
UPDATE "companies" c
SET "organization_id" = u."organization_id"
FROM "crm_users" u
WHERE c."crm_user_id" = u."id" AND c."organization_id" IS NULL;

UPDATE "contacts" c
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT co."organization_id" FROM "companies" co WHERE co."id" = c."company_id")
)
FROM "crm_users" u
WHERE c."crm_user_id" = u."id" AND c."organization_id" IS NULL;

UPDATE "deals" d
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT co."organization_id" FROM "companies" co WHERE co."id" = d."company_id")
)
FROM "crm_users" u
WHERE d."crm_user_id" = u."id" AND d."organization_id" IS NULL;

UPDATE "tasks" t
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT ct."organization_id" FROM "contacts" ct WHERE ct."id" = t."contact_id")
)
FROM "crm_users" u
WHERE t."crm_user_id" = u."id" AND t."organization_id" IS NULL;

UPDATE "contact_notes" n
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT ct."organization_id" FROM "contacts" ct WHERE ct."id" = n."contact_id")
)
FROM "crm_users" u
WHERE n."crm_user_id" = u."id" AND n."organization_id" IS NULL;

UPDATE "deal_notes" n
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT d."organization_id" FROM "deals" d WHERE d."id" = n."deal_id")
)
FROM "crm_users" u
WHERE n."crm_user_id" = u."id" AND n."organization_id" IS NULL;

UPDATE "automation_rules" r
SET "organization_id" = u."organization_id"
FROM "crm_users" u
WHERE r."crm_user_id" = u."id" AND r."organization_id" IS NULL;

UPDATE "automation_runs" r
SET "organization_id" = COALESCE(
  u."organization_id",
  (SELECT ar."organization_id" FROM "automation_rules" ar WHERE ar."id" = r."rule_id")
)
FROM "crm_users" u
WHERE r."crm_user_id" = u."id" AND r."organization_id" IS NULL;

UPDATE "context_embeddings" e
SET "organization_id" = u."organization_id"
FROM "crm_users" u
WHERE e."crm_user_id" = u."id" AND e."organization_id" IS NULL;

UPDATE "record_favorites" f
SET "organization_id" = u."organization_id"
FROM "crm_users" u
WHERE f."crm_user_id" = u."id" AND f."organization_id" IS NULL;

UPDATE "views" v
SET "organization_id" = u."organization_id"
FROM "crm_users" u
WHERE v."crm_user_id" = u."id" AND v."organization_id" IS NULL;
--> statement-breakpoint

-- 4) Add organization FK constraints (nullable for safe rollout)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_organization_id_organizations_id_fk') THEN
    ALTER TABLE "companies"
      ADD CONSTRAINT "companies_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contacts_organization_id_organizations_id_fk') THEN
    ALTER TABLE "contacts"
      ADD CONSTRAINT "contacts_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_organization_id_organizations_id_fk') THEN
    ALTER TABLE "deals"
      ADD CONSTRAINT "deals_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_organization_id_organizations_id_fk') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_notes_organization_id_organizations_id_fk') THEN
    ALTER TABLE "contact_notes"
      ADD CONSTRAINT "contact_notes_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_notes_organization_id_organizations_id_fk') THEN
    ALTER TABLE "deal_notes"
      ADD CONSTRAINT "deal_notes_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automation_rules_organization_id_organizations_id_fk') THEN
    ALTER TABLE "automation_rules"
      ADD CONSTRAINT "automation_rules_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automation_runs_organization_id_organizations_id_fk') THEN
    ALTER TABLE "automation_runs"
      ADD CONSTRAINT "automation_runs_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'context_embeddings_organization_id_organizations_id_fk') THEN
    ALTER TABLE "context_embeddings"
      ADD CONSTRAINT "context_embeddings_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_organization_id_organizations_id_fk') THEN
    ALTER TABLE "tags"
      ADD CONSTRAINT "tags_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_field_defs_organization_id_organizations_id_fk') THEN
    ALTER TABLE "custom_field_defs"
      ADD CONSTRAINT "custom_field_defs_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'object_config_organization_id_organizations_id_fk') THEN
    ALTER TABLE "object_config"
      ADD CONSTRAINT "object_config_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'object_attribute_overrides_organization_id_organizations_id_fk') THEN
    ALTER TABLE "object_attribute_overrides"
      ADD CONSTRAINT "object_attribute_overrides_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'record_favorites_organization_id_organizations_id_fk') THEN
    ALTER TABLE "record_favorites"
      ADD CONSTRAINT "record_favorites_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'views_organization_id_organizations_id_fk') THEN
    ALTER TABLE "views"
      ADD CONSTRAINT "views_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

-- 5) Add deal_contacts join table (normalized relation)
CREATE TABLE IF NOT EXISTS "deal_contacts" (
  "id" bigserial PRIMARY KEY,
  "deal_id" bigint NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
  "contact_id" bigint NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
  "organization_id" uuid REFERENCES "organizations"("id") ON DELETE CASCADE,
  "crm_user_id" bigint REFERENCES "crm_users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "deal_contacts_unique" UNIQUE ("deal_id", "contact_id")
);
--> statement-breakpoint

INSERT INTO "deal_contacts" ("deal_id", "contact_id", "organization_id", "crm_user_id")
SELECT
  d.id,
  (jsonb_array_elements_text(d.contact_ids))::bigint AS contact_id,
  d.organization_id,
  d.crm_user_id
FROM deals d
WHERE d.contact_ids IS NOT NULL
ON CONFLICT ("deal_id", "contact_id") DO NOTHING;
--> statement-breakpoint

-- 6) Recreate key indexes with new naming + add org/search indexes
CREATE INDEX IF NOT EXISTS "companies_crm_user_id_idx" ON "companies" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "contacts_crm_user_id_idx" ON "contacts" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "deals_crm_user_id_idx" ON "deals" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "tasks_crm_user_id_idx" ON "tasks" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "contact_notes_crm_user_id_idx" ON "contact_notes" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "deal_notes_crm_user_id_idx" ON "deal_notes" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "ai_threads_crm_user_id_idx" ON "ai_threads" ("crm_user_id");
CREATE INDEX IF NOT EXISTS "ai_memory_crm_user_id_idx" ON "ai_memory_items" ("crm_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "context_embeddings_crm_user_entity_idx"
  ON "context_embeddings" ("crm_user_id", "entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "companies_org_idx" ON "companies" ("organization_id");
CREATE INDEX IF NOT EXISTS "contacts_org_idx" ON "contacts" ("organization_id");
CREATE INDEX IF NOT EXISTS "deals_org_idx" ON "deals" ("organization_id");
CREATE INDEX IF NOT EXISTS "tasks_org_idx" ON "tasks" ("organization_id");
CREATE INDEX IF NOT EXISTS "contact_notes_org_idx" ON "contact_notes" ("organization_id");
CREATE INDEX IF NOT EXISTS "deal_notes_org_idx" ON "deal_notes" ("organization_id");
CREATE INDEX IF NOT EXISTS "views_object_slug_org_idx" ON "views" ("object_slug", "organization_id");

CREATE INDEX IF NOT EXISTS "deal_contacts_deal_idx" ON "deal_contacts" ("deal_id");
CREATE INDEX IF NOT EXISTS "deal_contacts_contact_idx" ON "deal_contacts" ("contact_id");
CREATE INDEX IF NOT EXISTS "deal_contacts_org_idx" ON "deal_contacts" ("organization_id");

CREATE INDEX IF NOT EXISTS "companies_name_trgm_idx" ON "companies" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "contacts_first_name_trgm_idx" ON "contacts" USING gin ("first_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "contacts_last_name_trgm_idx" ON "contacts" USING gin ("last_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "deals_name_trgm_idx" ON "deals" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint

-- 7) Update vector match function for renamed column
DROP FUNCTION IF EXISTS "public"."match_context_embeddings"(bigint, vector, int);
CREATE FUNCTION "public"."match_context_embeddings"(
  p_crm_user_id bigint,
  p_query_embedding vector(3072),
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  entity_type text,
  entity_id bigint,
  chunk_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ce.entity_type,
    ce.entity_id,
    ce.chunk_text
  FROM context_embeddings ce
  WHERE ce.crm_user_id = p_crm_user_id
    AND ce.embedding IS NOT NULL
  ORDER BY ce.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

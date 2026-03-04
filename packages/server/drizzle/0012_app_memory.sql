CREATE TABLE IF NOT EXISTS "ai_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sales_id" bigint NOT NULL,
  "organization_id" uuid NOT NULL,
  "channel" varchar(16) DEFAULT 'chat' NOT NULL,
  "title" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_threads_sales_id_sales_id_fk'
  ) THEN
    ALTER TABLE "ai_threads"
      ADD CONSTRAINT "ai_threads_sales_id_sales_id_fk"
      FOREIGN KEY ("sales_id")
      REFERENCES "public"."crm_users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_threads_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "ai_threads"
      ADD CONSTRAINT "ai_threads_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ai_threads_sales_idx" ON "ai_threads" ("sales_id");
CREATE INDEX IF NOT EXISTS "ai_threads_org_idx" ON "ai_threads" ("organization_id");
CREATE INDEX IF NOT EXISTS "ai_threads_channel_idx" ON "ai_threads" ("channel");

CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "thread_id" uuid NOT NULL,
  "role" varchar(16) NOT NULL,
  "content" text,
  "tool_name" varchar(128),
  "tool_args" jsonb,
  "tool_result" jsonb,
  "token_count" bigint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_messages_thread_id_ai_threads_id_fk'
  ) THEN
    ALTER TABLE "ai_messages"
      ADD CONSTRAINT "ai_messages_thread_id_ai_threads_id_fk"
      FOREIGN KEY ("thread_id")
      REFERENCES "public"."ai_threads"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ai_messages_thread_created_idx" ON "ai_messages" ("thread_id", "created_at");

CREATE TABLE IF NOT EXISTS "ai_memory_items" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "sales_id" bigint,
  "scope" varchar(16) DEFAULT 'org' NOT NULL,
  "thread_id" uuid,
  "kind" varchar(32) NOT NULL,
  "key" varchar(255),
  "value" jsonb NOT NULL,
  "importance" smallint DEFAULT 5 NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_memory_items_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "ai_memory_items"
      ADD CONSTRAINT "ai_memory_items_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_memory_items_sales_id_sales_id_fk'
  ) THEN
    ALTER TABLE "ai_memory_items"
      ADD CONSTRAINT "ai_memory_items_sales_id_sales_id_fk"
      FOREIGN KEY ("sales_id")
      REFERENCES "public"."crm_users"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_memory_items_thread_id_ai_threads_id_fk'
  ) THEN
    ALTER TABLE "ai_memory_items"
      ADD CONSTRAINT "ai_memory_items_thread_id_ai_threads_id_fk"
      FOREIGN KEY ("thread_id")
      REFERENCES "public"."ai_threads"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ai_memory_org_scope_kind_key_idx"
  ON "ai_memory_items" ("organization_id", "scope", "kind", "key");
CREATE INDEX IF NOT EXISTS "ai_memory_sales_idx" ON "ai_memory_items" ("sales_id");
CREATE INDEX IF NOT EXISTS "ai_memory_thread_idx" ON "ai_memory_items" ("thread_id");

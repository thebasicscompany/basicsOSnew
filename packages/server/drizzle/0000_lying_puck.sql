CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" varchar(255),
	"password" varchar(255),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(255),
	"user_id" varchar(255) NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" varchar(255),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_rules" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sales_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_type" varchar(64) NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"action_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(255),
	"size" smallint,
	"linkedin_url" varchar(512),
	"website" varchar(512),
	"phone_number" varchar(64),
	"address" text,
	"zipcode" varchar(32),
	"city" varchar(128),
	"state_abbr" varchar(16),
	"country" varchar(128),
	"description" text,
	"revenue" varchar(64),
	"tax_identifier" varchar(64),
	"logo" jsonb,
	"sales_id" bigint,
	"context_links" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "configuration" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contact_id" bigint NOT NULL,
	"text" text,
	"date" timestamp with time zone DEFAULT now(),
	"sales_id" bigint,
	"status" varchar(64),
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"gender" varchar(32),
	"title" varchar(255),
	"email" text,
	"email_jsonb" jsonb,
	"phone_jsonb" jsonb,
	"background" text,
	"avatar" jsonb,
	"first_seen" timestamp with time zone,
	"last_seen" timestamp with time zone,
	"has_newsletter" boolean,
	"status" varchar(64),
	"tags" jsonb,
	"company_id" bigint,
	"sales_id" bigint,
	"linkedin_url" varchar(512)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "context_embeddings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sales_id" bigint NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" bigint NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding" vector(3072),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deal_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"deal_id" bigint NOT NULL,
	"type" varchar(64),
	"text" text,
	"date" timestamp with time zone DEFAULT now(),
	"sales_id" bigint,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_id" bigint,
	"contact_ids" jsonb,
	"category" varchar(128),
	"stage" varchar(128) NOT NULL,
	"description" text,
	"amount" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"expected_closing_date" timestamp with time zone,
	"sales_id" bigint,
	"index" smallint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favicons_excluded_domains" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"organization_id" uuid,
	"administrator" boolean NOT NULL,
	"avatar" jsonb,
	"disabled" boolean DEFAULT false NOT NULL,
	"basics_api_key" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"contact_id" bigint NOT NULL,
	"sales_id" bigint,
	"type" varchar(64),
	"text" text,
	"due_date" timestamp with time zone,
	"done_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context_embeddings" ADD CONSTRAINT "context_embeddings_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_notes" ADD CONSTRAINT "deal_notes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_notes" ADD CONSTRAINT "deal_notes_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deals" ADD CONSTRAINT "deals_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "context_embeddings_sales_entity_idx" ON "context_embeddings" USING btree ("sales_id","entity_type","entity_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."match_context_embeddings"(
  p_sales_id bigint,
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
  WHERE ce.sales_id = p_sales_id
    AND ce.embedding IS NOT NULL
  ORDER BY ce.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
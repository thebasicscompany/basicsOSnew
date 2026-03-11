CREATE TABLE IF NOT EXISTS "enrichment_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" integer NOT NULL,
	"source" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"credits_used" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrichment_credits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"monthly_limit" integer DEFAULT 100 NOT NULL,
	"used_this_month" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrichment_credits_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrichment_credits" ADD CONSTRAINT "enrichment_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

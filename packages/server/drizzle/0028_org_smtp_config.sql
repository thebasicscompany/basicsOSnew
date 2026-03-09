CREATE TABLE IF NOT EXISTS "org_smtp_config" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "host" varchar(255) NOT NULL,
  "port" integer NOT NULL,
  "user" varchar(255) NOT NULL,
  "password_enc" text,
  "from_email" varchar(255) NOT NULL,
  "configured_by" bigint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_smtp_config" ADD CONSTRAINT "org_smtp_config_organization_id_unique" UNIQUE ("organization_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_smtp_config" ADD CONSTRAINT "org_smtp_config_organization_id_organizations_id_fk"
 FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
 ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_smtp_config" ADD CONSTRAINT "org_smtp_config_configured_by_crm_users_id_fk"
 FOREIGN KEY ("configured_by") REFERENCES "public"."crm_users"("id")
 ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

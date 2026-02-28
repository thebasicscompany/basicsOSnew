ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "custom_fields" jsonb NOT NULL DEFAULT '{}';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_field_defs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"resource" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"label" varchar(255) NOT NULL,
	"field_type" varchar(32) NOT NULL,
	"options" jsonb,
	"position" smallint NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "custom_field_defs_resource_name_unique" ON "custom_field_defs" ("resource","name");

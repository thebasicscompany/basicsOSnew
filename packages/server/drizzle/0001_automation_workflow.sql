-- Drop old automation_rules columns and add workflow_definition
ALTER TABLE "automation_rules" DROP COLUMN IF EXISTS "trigger_type";
--> statement-breakpoint
ALTER TABLE "automation_rules" DROP COLUMN IF EXISTS "trigger_config";
--> statement-breakpoint
ALTER TABLE "automation_rules" DROP COLUMN IF EXISTS "action_type";
--> statement-breakpoint
ALTER TABLE "automation_rules" DROP COLUMN IF EXISTS "action_config";
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN IF NOT EXISTS "workflow_definition" jsonb NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD COLUMN IF NOT EXISTS "last_run_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"rule_id" bigint NOT NULL,
	"sales_id" bigint NOT NULL,
	"status" varchar(32) NOT NULL,
	"result" jsonb,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_sales_id_sales_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

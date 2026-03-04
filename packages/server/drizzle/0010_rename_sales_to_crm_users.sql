DO $$ BEGIN
 IF to_regclass('public.sales') IS NOT NULL AND to_regclass('public.crm_users') IS NULL THEN
  ALTER TABLE "sales" RENAME TO "crm_users";
 END IF;
END $$;
--> statement-breakpoint
ALTER SEQUENCE IF EXISTS "sales_id_seq" RENAME TO "crm_users_id_seq";
--> statement-breakpoint
DO $$ BEGIN
 IF to_regclass('public.crm_users') IS NOT NULL THEN
  ALTER TABLE "crm_users"
  ALTER COLUMN "id" SET DEFAULT nextval('crm_users_id_seq'::regclass);
 END IF;
END $$;

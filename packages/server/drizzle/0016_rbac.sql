CREATE TABLE IF NOT EXISTS "rbac_roles" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "key" varchar(128) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_system" boolean NOT NULL DEFAULT true,
  "organization_id" uuid
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rbac_permissions" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "key" varchar(128) NOT NULL UNIQUE,
  "description" text
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rbac_role_permissions" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "role_id" bigint NOT NULL,
  "permission_id" bigint NOT NULL,
  CONSTRAINT "rbac_role_permissions_role_id_permission_id_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rbac_user_roles" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "crm_user_id" bigint NOT NULL,
  "role_id" bigint NOT NULL,
  "organization_id" uuid,
  CONSTRAINT "rbac_user_roles_crm_user_id_role_id_organization_id_unique" UNIQUE("crm_user_id","role_id","organization_id")
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_roles"
    ADD CONSTRAINT "rbac_roles_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_role_permissions"
    ADD CONSTRAINT "rbac_role_permissions_role_id_rbac_roles_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_role_permissions"
    ADD CONSTRAINT "rbac_role_permissions_permission_id_rbac_permissions_id_fk"
    FOREIGN KEY ("permission_id") REFERENCES "public"."rbac_permissions"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_user_roles"
    ADD CONSTRAINT "rbac_user_roles_crm_user_id_crm_users_id_fk"
    FOREIGN KEY ("crm_user_id") REFERENCES "public"."crm_users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_user_roles"
    ADD CONSTRAINT "rbac_user_roles_role_id_rbac_roles_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "public"."rbac_roles"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "rbac_user_roles"
    ADD CONSTRAINT "rbac_user_roles_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "rbac_roles_org_idx" ON "rbac_roles" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "rbac_user_roles_user_idx" ON "rbac_user_roles" USING btree ("crm_user_id");
CREATE INDEX IF NOT EXISTS "rbac_user_roles_org_idx" ON "rbac_user_roles" USING btree ("organization_id");
--> statement-breakpoint

INSERT INTO "rbac_permissions" ("key", "description") VALUES
  ('records.read', 'Read CRM records'),
  ('records.write', 'Create/update CRM records'),
  ('records.archive', 'Archive records'),
  ('records.restore', 'Restore archived records'),
  ('records.delete.hard', 'Permanently delete records'),
  ('records.merge', 'Merge CRM records'),
  ('object_config.write', 'Modify object configuration')
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint

INSERT INTO "rbac_roles" ("key", "name", "description", "is_system") VALUES
  ('org_admin', 'Organization Admin', 'Full CRM access including hard delete and config changes', true),
  ('member', 'Member', 'Standard CRM collaborator', true)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint

WITH role_map AS (
  SELECT id, key FROM rbac_roles WHERE key IN ('org_admin', 'member')
),
perm_map AS (
  SELECT id, key FROM rbac_permissions
)
INSERT INTO rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_map r
JOIN perm_map p ON (
  (r.key = 'org_admin' AND p.key IN ('records.read','records.write','records.archive','records.restore','records.delete.hard','records.merge','object_config.write'))
  OR
  (r.key = 'member' AND p.key IN ('records.read','records.write','records.archive'))
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
--> statement-breakpoint

WITH role_map AS (
  SELECT id, key FROM rbac_roles WHERE key IN ('org_admin', 'member')
)
INSERT INTO rbac_user_roles (crm_user_id, role_id, organization_id)
SELECT
  cu.id,
  CASE WHEN cu.administrator THEN (SELECT id FROM role_map WHERE key = 'org_admin')
       ELSE (SELECT id FROM role_map WHERE key = 'member')
  END AS role_id,
  cu.organization_id
FROM crm_users cu
WHERE cu.organization_id IS NOT NULL
ON CONFLICT (crm_user_id, role_id, organization_id) DO NOTHING;

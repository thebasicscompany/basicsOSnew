CREATE TABLE "crm_api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crm_user_id" bigint NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"token_prefix" varchar(32) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "crm_api_tokens_crm_user_id_crm_users_id_fk" FOREIGN KEY ("crm_user_id") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
	CONSTRAINT "crm_api_tokens_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
	CONSTRAINT "crm_api_tokens_token_hash_unique" UNIQUE("token_hash")
);
CREATE INDEX "crm_api_tokens_crm_user_idx" ON "crm_api_tokens" ("crm_user_id");
CREATE INDEX "crm_api_tokens_org_idx" ON "crm_api_tokens" ("organization_id");

-- Add indexes for CRM list/filter queries

CREATE INDEX IF NOT EXISTS "contacts_sales_id_idx" ON "contacts" ("sales_id");
CREATE INDEX IF NOT EXISTS "contacts_company_id_idx" ON "contacts" ("company_id");
CREATE INDEX IF NOT EXISTS "contacts_status_idx" ON "contacts" ("status");

CREATE INDEX IF NOT EXISTS "companies_sales_id_idx" ON "companies" ("sales_id");
CREATE INDEX IF NOT EXISTS "companies_sector_idx" ON "companies" ("sector");

CREATE INDEX IF NOT EXISTS "deals_sales_id_idx" ON "deals" ("sales_id");
CREATE INDEX IF NOT EXISTS "deals_company_id_idx" ON "deals" ("company_id");
CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals" ("stage");
CREATE INDEX IF NOT EXISTS "deals_category_idx" ON "deals" ("category");

CREATE INDEX IF NOT EXISTS "tasks_contact_id_idx" ON "tasks" ("contact_id");
CREATE INDEX IF NOT EXISTS "tasks_sales_id_idx" ON "tasks" ("sales_id");

CREATE INDEX IF NOT EXISTS "contact_notes_contact_id_idx" ON "contact_notes" ("contact_id");
CREATE INDEX IF NOT EXISTS "contact_notes_sales_id_idx" ON "contact_notes" ("sales_id");

CREATE INDEX IF NOT EXISTS "deal_notes_deal_id_idx" ON "deal_notes" ("deal_id");
CREATE INDEX IF NOT EXISTS "deal_notes_sales_id_idx" ON "deal_notes" ("sales_id");

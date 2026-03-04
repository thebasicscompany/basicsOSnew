-- View persistence tables (replaces NocoDB view metadata)

CREATE TABLE IF NOT EXISTS "views" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "object_slug" varchar(64) NOT NULL,
  "sales_id" bigint NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT 'grid',
  "display_order" smallint NOT NULL DEFAULT 0,
  "is_default" boolean NOT NULL DEFAULT false,
  "lock_type" varchar(32),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "views_slug_sales" ON "views" ("object_slug", "sales_id");

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "view_columns" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "view_id" text NOT NULL REFERENCES "views"("id") ON DELETE CASCADE,
  "field_id" varchar(128) NOT NULL,
  "title" varchar(255),
  "show" boolean NOT NULL DEFAULT true,
  "display_order" smallint NOT NULL DEFAULT 0,
  "width" varchar(32),
  UNIQUE("view_id", "field_id")
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "view_sorts" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "view_id" text NOT NULL REFERENCES "views"("id") ON DELETE CASCADE,
  "field_id" varchar(128) NOT NULL,
  "direction" varchar(4) NOT NULL DEFAULT 'asc',
  "display_order" smallint NOT NULL DEFAULT 0
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "view_filters" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "view_id" text NOT NULL REFERENCES "views"("id") ON DELETE CASCADE,
  "field_id" varchar(128) NOT NULL,
  "comparison_op" varchar(32) NOT NULL,
  "value" text,
  "logical_op" varchar(8) NOT NULL DEFAULT 'and'
);

-- Object Configuration Tables for Generic CRM System

CREATE TABLE "object_config" (
    "id" bigserial PRIMARY KEY,
    "slug" varchar(64) NOT NULL UNIQUE,
    "singular_name" varchar(128) NOT NULL,
    "plural_name" varchar(128) NOT NULL,
    "icon" varchar(64) NOT NULL DEFAULT 'building',
    "icon_color" varchar(32) NOT NULL DEFAULT 'blue',
    "noco_table_name" varchar(128) NOT NULL,
    "type" varchar(32) NOT NULL DEFAULT 'standard',
    "is_active" boolean NOT NULL DEFAULT true,
    "position" smallint NOT NULL DEFAULT 0,
    "settings" jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE "object_attribute_overrides" (
    "id" bigserial PRIMARY KEY,
    "object_config_id" bigint NOT NULL REFERENCES object_config(id) ON DELETE CASCADE,
    "column_name" varchar(128) NOT NULL,
    "display_name" varchar(255),
    "ui_type" varchar(64),
    "icon" varchar(64),
    "is_primary" boolean DEFAULT false,
    "is_hidden_by_default" boolean DEFAULT false,
    "config" jsonb NOT NULL DEFAULT '{}',
    UNIQUE("object_config_id", "column_name")
);

CREATE TABLE "record_favorites" (
    "id" bigserial PRIMARY KEY,
    "sales_id" bigint NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    "object_slug" varchar(64) NOT NULL,
    "record_id" bigint NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    UNIQUE("sales_id", "object_slug", "record_id")
);

-- Seed object_config
INSERT INTO object_config (slug, singular_name, plural_name, icon, icon_color, noco_table_name, type, is_active, position) VALUES
  ('companies', 'Company', 'Companies', 'building-2', 'blue', 'companies', 'standard', true, 0),
  ('contacts', 'Person', 'People', 'users', 'orange', 'contacts', 'standard', true, 1),
  ('deals', 'Deal', 'Deals', 'handshake', 'orange', 'deals', 'standard', true, 2);

-- Seed attribute overrides
INSERT INTO object_attribute_overrides (object_config_id, column_name, display_name, ui_type, is_primary, config) VALUES
  -- Companies
  ((SELECT id FROM object_config WHERE slug = 'companies'), 'name', 'Name', NULL, true, '{}'),
  ((SELECT id FROM object_config WHERE slug = 'companies'), 'sector', 'Sector', 'select', false, '{}'),

  -- Contacts
  ((SELECT id FROM object_config WHERE slug = 'contacts'), 'first_name', 'First Name', NULL, true, '{}'),
  ((SELECT id FROM object_config WHERE slug = 'contacts'), 'last_name', 'Last Name', NULL, false, '{}'),
  ((SELECT id FROM object_config WHERE slug = 'contacts'), 'status', 'Status', 'status', false, '{"options":[{"id":"cold","label":"Cold","color":"blue","order":0},{"id":"warm","label":"Warm","color":"orange","order":1},{"id":"hot","label":"Hot","color":"red","order":2},{"id":"in-contract","label":"In Contract","color":"green","order":3},{"id":"churned","label":"Churned","color":"gray","order":4}]}'),
  ((SELECT id FROM object_config WHERE slug = 'contacts'), 'email', 'Email', 'email', false, '{}'),
  ((SELECT id FROM object_config WHERE slug = 'contacts'), 'phone_number', 'Phone', 'phone', false, '{}'),

  -- Deals
  ((SELECT id FROM object_config WHERE slug = 'deals'), 'name', 'Name', NULL, true, '{}'),
  ((SELECT id FROM object_config WHERE slug = 'deals'), 'stage', 'Stage', 'status', false, '{"options":[{"id":"opportunity","label":"Opportunity","color":"blue","order":0},{"id":"proposal-made","label":"Proposal Made","color":"cyan","order":1},{"id":"in-negotiation","label":"In Negotiation","color":"orange","order":2},{"id":"won","label":"Won","color":"green","order":3,"isTerminal":true},{"id":"lost","label":"Lost","color":"red","order":4,"isTerminal":true},{"id":"delayed","label":"Delayed","color":"gray","order":5}]}'),
  ((SELECT id FROM object_config WHERE slug = 'deals'), 'amount', 'Amount', 'currency', false, '{"currencyCode":"USD","currencySymbol":"$","decimalPlaces":2,"stepAmount":1000}'),
  ((SELECT id FROM object_config WHERE slug = 'deals'), 'expected_close_date', 'Expected Close', 'date', false, '{}');

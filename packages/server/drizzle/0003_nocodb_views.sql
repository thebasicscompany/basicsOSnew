-- Summary views for NocoDB introspection.
-- NocoDB picks up PostgreSQL VIEWs as read-only tables during introspection.

CREATE OR REPLACE VIEW contacts_summary AS
SELECT
  c.*,
  co.name AS company_name,
  COALESCE(t.cnt, 0)::int AS nb_tasks
FROM contacts c
LEFT JOIN companies co ON c.company_id = co.id
LEFT JOIN (
  SELECT contact_id, COUNT(*)::int AS cnt
  FROM tasks
  GROUP BY contact_id
) t ON c.id = t.contact_id;

--> statement-breakpoint

CREATE OR REPLACE VIEW companies_summary AS
SELECT
  c.*,
  COALESCE(d.cnt, 0)::int AS nb_deals,
  COALESCE(ct.cnt, 0)::int AS nb_contacts
FROM companies c
LEFT JOIN (
  SELECT company_id, COUNT(*)::int AS cnt
  FROM deals
  GROUP BY company_id
) d ON c.id = d.company_id
LEFT JOIN (
  SELECT company_id, COUNT(*)::int AS cnt
  FROM contacts
  GROUP BY company_id
) ct ON c.id = ct.company_id;

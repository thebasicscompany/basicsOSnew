-- Make views org-shared: all org members can see and edit views created by anyone in the org.
-- Add created_by_crm_user_id to view_filters so we can display who saved each filter.

ALTER TABLE "view_filters"
  ADD COLUMN "created_by_crm_user_id" bigint
    REFERENCES "crm_users" ("id") ON DELETE SET NULL;

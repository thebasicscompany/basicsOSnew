-- Tasks: link to deals so tasks can be associated with a deal
ALTER TABLE tasks ADD COLUMN deal_id bigint REFERENCES deals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tasks_deal_id_idx ON tasks(deal_id);

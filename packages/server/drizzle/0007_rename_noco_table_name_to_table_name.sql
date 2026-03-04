-- Rename object_config.noco_table_name to table_name (Postgres table name for this object)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'object_config'
      AND column_name = 'noco_table_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'object_config'
      AND column_name = 'table_name'
  ) THEN
    ALTER TABLE "object_config" RENAME COLUMN "noco_table_name" TO "table_name";
  END IF;
END $$;

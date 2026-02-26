import { pgTable, integer, jsonb } from "drizzle-orm/pg-core";

export const configuration = pgTable("configuration", {
  id: integer("id").primaryKey().default(1),
  config: jsonb("config").notNull().default({}),
});

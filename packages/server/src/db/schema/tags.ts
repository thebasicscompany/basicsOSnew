import { pgTable, bigserial, varchar } from "drizzle-orm/pg-core";

export const tags = pgTable("tags", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 64 }).notNull(),
});

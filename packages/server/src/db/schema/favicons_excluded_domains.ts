import { pgTable, bigserial, varchar } from "drizzle-orm/pg-core";

export const faviconsExcludedDomains = pgTable("favicons_excluded_domains", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull(),
});

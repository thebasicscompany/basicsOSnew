import {
  pgTable,
  bigserial,
  varchar,
  boolean,
  jsonb,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { sales } from "./sales.js";

export const automationRules = pgTable("automation_rules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  salesId: bigint("sales_id", { mode: "number" })
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  enabled: boolean("enabled").notNull().default(true),
  workflowDefinition: jsonb("workflow_definition").notNull().default({}),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: varchar("last_run_status", { length: 16 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

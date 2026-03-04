import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { automationRules } from "./automation_rules.js";
import { crmUsers } from "./crm_users.js";

export const automationRuns = pgTable("automation_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ruleId: bigint("rule_id", { mode: "number" })
    .notNull()
    .references(() => automationRules.id, { onDelete: "cascade" }),
  crmUserId: bigint("sales_id", { mode: "number" })
    .notNull()
    .references(() => crmUsers.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull(), // 'running' | 'success' | 'error'
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

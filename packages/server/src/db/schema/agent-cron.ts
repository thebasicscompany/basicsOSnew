import {
  pgTable,
  bigserial,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";
import { organizations } from "@/db/schema/organizations.js";
import { crmUsers } from "@/db/schema/crm_users.js";

export const agentCronJobs = pgTable("agent_cron_jobs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  crmUserId: bigint("crm_user_id", { mode: "number" })
    .notNull()
    .references(() => crmUsers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  schedule: varchar("schedule", { length: 100 }).notNull(), // cron expression
  prompt: text("prompt").notNull(), // what to tell the agent
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: varchar("last_run_status", { length: 32 }),
  lastRunResult: text("last_run_result"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

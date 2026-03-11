import {
  pgTable,
  bigserial,
  varchar,
  text,
  jsonb,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { organizations } from "@/db/schema/organizations.js";

export const enrichmentJobs = pgTable("enrichment_jobs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: integer("entity_id").notNull(),
  source: varchar("source", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  result: jsonb("result"),
  error: text("error"),
  creditsUsed: integer("credits_used").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const enrichmentCredits = pgTable("enrichment_credits", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),
  monthlyLimit: integer("monthly_limit").default(100).notNull(),
  usedThisMonth: integer("used_this_month").default(0).notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

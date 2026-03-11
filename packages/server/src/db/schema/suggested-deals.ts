import {
  pgTable,
  bigserial,
  uuid,
  varchar,
  smallint,
  bigint,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "@/db/schema/organizations.js";

export const suggestedDeals = pgTable(
  "suggested_deals",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    sourceEmailId: bigint("source_email_id", { mode: "number" }),
    gmailThreadId: varchar("gmail_thread_id", { length: 64 }),

    // AI-extracted deal info
    dealName: varchar("deal_name", { length: 512 }),
    founderName: varchar("founder_name", { length: 255 }),
    founderEmail: varchar("founder_email", { length: 512 }),
    companyName: varchar("company_name", { length: 255 }),
    companyDomain: varchar("company_domain", { length: 255 }),
    companyCategory: varchar("company_category", { length: 255 }),
    description: text("description"),

    // Scoring
    score: smallint("score").default(0).notNull(),
    signals: jsonb("signals")
      .$type<{
        emailCount: number;
        threadCount: number;
        isBidirectional: boolean;
        isIntroEmail: boolean;
        hasFounderSignals: boolean;
        confidence: number;
      }>()
      .default({
        emailCount: 0,
        threadCount: 0,
        isBidirectional: false,
        isIntroEmail: false,
        hasFounderSignals: false,
        confidence: 0,
      })
      .notNull(),

    // Lifecycle
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    // Created record IDs (populated on accept)
    createdDealId: bigint("created_deal_id", { mode: "number" }),
    createdContactId: bigint("created_contact_id", { mode: "number" }),
    createdCompanyId: bigint("created_company_id", { mode: "number" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("suggested_deals_org_thread_idx").on(
      t.organizationId,
      t.gmailThreadId,
    ),
    index("suggested_deals_org_status_score_idx").on(
      t.organizationId,
      t.status,
      t.score,
    ),
  ],
);

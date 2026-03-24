import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { crmUsers } from "@/db/schema/crm_users.js";
import { organizations } from "@/db/schema/organizations.js";

/** Personal access tokens for programmatic CRM API access (same RBAC as the user). */
export const crmApiTokens = pgTable(
  "crm_api_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    crmUserId: bigint("crm_user_id", { mode: "number" })
      .notNull()
      .references(() => crmUsers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    /** First characters of the secret for display (e.g. bos_crm_abc123…). */
    tokenPrefix: varchar("token_prefix", { length: 32 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    index("crm_api_tokens_crm_user_idx").on(t.crmUserId),
    index("crm_api_tokens_org_idx").on(t.organizationId),
  ],
);

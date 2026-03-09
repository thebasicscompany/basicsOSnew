import {
  pgTable,
  bigserial,
  varchar,
  integer,
  text,
  uuid,
  bigint,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "@/db/schema/organizations.js";
import { crmUsers } from "@/db/schema/crm_users.js";

export const orgSmtpConfig = pgTable("org_smtp_config", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull(),
  user: varchar("user", { length: 255 }).notNull(),
  passwordEnc: text("password_enc"),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  configuredBy: bigint("configured_by", { mode: "number" }).references(
    () => crmUsers.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

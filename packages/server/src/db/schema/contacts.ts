import {
  pgTable,
  bigserial,
  varchar,
  text,
  boolean,
  timestamp,
  bigint,
  jsonb,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sales } from "./sales";

export const contacts = pgTable("contacts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  gender: varchar("gender", { length: 32 }),
  title: varchar("title", { length: 255 }),
  email: text("email"), // legacy; email_jsonb used
  emailJsonb: jsonb("email_jsonb"), // [{ email, type }]
  phoneJsonb: jsonb("phone_jsonb"), // [{ number, type }]
  background: text("background"),
  avatar: jsonb("avatar"), // { src: string }
  firstSeen: timestamp("first_seen", { withTimezone: true }),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  hasNewsletter: boolean("has_newsletter"),
  status: varchar("status", { length: 64 }),
  tags: jsonb("tags").$type<number[]>(),
  companyId: bigint("company_id", { mode: "number" }).references(() => companies.id, {
    onDelete: "cascade",
  }),
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id),
  linkedinUrl: varchar("linkedin_url", { length: 512 }),
});

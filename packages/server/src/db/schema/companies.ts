import {
  pgTable,
  bigserial,
  varchar,
  text,
  smallint,
  json,
  jsonb,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { sales } from "./sales";

export const companies = pgTable("companies", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 255 }),
  size: smallint("size"),
  linkedinUrl: varchar("linkedin_url", { length: 512 }),
  website: varchar("website", { length: 512 }),
  phoneNumber: varchar("phone_number", { length: 64 }),
  address: text("address"),
  zipcode: varchar("zipcode", { length: 32 }),
  city: varchar("city", { length: 128 }),
  stateAbbr: varchar("state_abbr", { length: 16 }),
  country: varchar("country", { length: 128 }),
  description: text("description"),
  revenue: varchar("revenue", { length: 64 }),
  taxIdentifier: varchar("tax_identifier", { length: 64 }),
  logo: jsonb("logo"), // { src: string }
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id),
  contextLinks: json("context_links"),
});

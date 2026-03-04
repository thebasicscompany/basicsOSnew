import {
  pgTable,
  bigserial,
  varchar,
  text,
  bigint,
  timestamp,
  vector,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { crmUsers } from "./crm_users";

export const contextEmbeddings = pgTable(
  "context_embeddings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    crmUserId: bigint("sales_id", { mode: "number" })
      .notNull()
      .references(() => crmUsers.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 3072 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("context_embeddings_crm_user_entity_idx").on(
      t.crmUserId,
      t.entityType,
      t.entityId
    ),
  ]
);

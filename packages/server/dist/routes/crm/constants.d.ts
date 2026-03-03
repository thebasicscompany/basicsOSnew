import type { PgTableWithColumns } from "drizzle-orm/pg-core";
export declare const CRM_RESOURCES: readonly ["contacts", "companies", "deals", "contact_notes", "deal_notes", "tasks", "sales", "tags", "configuration", "automation_rules", "companies_summary", "contacts_summary"];
export type Resource = (typeof CRM_RESOURCES)[number];
export declare const TABLE_MAP: Record<Exclude<Resource, "companies_summary" | "contacts_summary">, PgTableWithColumns<any>>;
export declare function hasSalesId(resource: Resource): boolean;
//# sourceMappingURL=constants.d.ts.map
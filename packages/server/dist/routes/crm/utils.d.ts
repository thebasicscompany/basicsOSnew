import { type SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
export declare function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown>;
export declare function snakeToCamelField(field: string): string;
export interface GenericFilter {
    field: string;
    op: string;
    value: string;
}
export declare function buildGenericFilterCondition(table: PgTableWithColumns<any>, f: GenericFilter): SQL | null;
//# sourceMappingURL=utils.d.ts.map
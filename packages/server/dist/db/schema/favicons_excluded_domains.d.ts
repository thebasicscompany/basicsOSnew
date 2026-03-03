export declare const faviconsExcludedDomains: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "favicons_excluded_domains";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "favicons_excluded_domains";
            dataType: "number";
            columnType: "PgBigSerial53";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        domain: import("drizzle-orm/pg-core").PgColumn<{
            name: "domain";
            tableName: "favicons_excluded_domains";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=favicons_excluded_domains.d.ts.map
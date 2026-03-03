import type { Db } from "./db/client.js";
export declare function createAuth(db: Db, baseUrl: string, secret: string): import("better-auth").Auth<{
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    basePath: string;
    baseURL: string;
    secret: string;
    trustedOrigins: (req: Request | undefined) => Promise<string[]>;
    emailAndPassword: {
        enabled: true;
    };
    session: {
        cookieCache: {
            enabled: true;
        };
    };
}>;
//# sourceMappingURL=auth.d.ts.map
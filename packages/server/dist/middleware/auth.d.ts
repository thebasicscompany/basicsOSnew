import type { Context, Next } from "hono";
type AuthWithApi = {
    handler: (req: Request) => Promise<Response>;
    api: {
        getSession: (opts: {
            headers: Headers;
        }) => Promise<{
            user?: unknown;
        } | null>;
    };
};
export declare function authMiddleware(auth: AuthWithApi): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
export {};
//# sourceMappingURL=auth.d.ts.map
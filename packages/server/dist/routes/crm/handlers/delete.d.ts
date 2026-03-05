import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
export declare function createDeleteHandler(db: Db): (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    [x: string]: import("hono/utils/types").JSONValue;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403 | 404, "json">) | (Response & import("hono").TypedResponse<{
    archived: true;
    record: {
        [x: string]: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
//# sourceMappingURL=delete.d.ts.map
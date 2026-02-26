import type { Context, Next } from "hono";

type AuthWithApi = {
  handler: (req: Request) => Promise<Response>;
  api: { getSession: (opts: { headers: Headers }) => Promise<{ user?: unknown } | null> };
};

export function authMiddleware(auth: AuthWithApi) {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("session", session);
    await next();
  };
}

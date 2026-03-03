export function authMiddleware(auth) {
    return async (c, next) => {
        const session = await auth.api.getSession({ headers: c.req.raw.headers });
        if (!session?.user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        c.set("session", session);
        await next();
    };
}

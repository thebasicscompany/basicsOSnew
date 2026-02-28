import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import * as schema from "../db/schema/index.js";
import { eq } from "drizzle-orm";

type Auth = ReturnType<typeof import("../auth.js").createAuth>;

export function createConnectionsRoutes(db: Db, auth: Auth, env: Env) {
  const app = new Hono();

  async function getSalesApiKey(userId: string): Promise<string | null> {
    const rows = await db
      .select({ basicsApiKey: schema.sales.basicsApiKey })
      .from(schema.sales)
      .where(eq(schema.sales.userId, userId))
      .limit(1);
    return rows[0]?.basicsApiKey ?? null;
  }

  // List all connections for the authenticated user
  app.get("/", authMiddleware(auth), async (c) => {
    const session = c.get("session") as { user?: { id: string } };
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const apiKey = await getSalesApiKey(userId);
    if (!apiKey) return c.json([]);

    const res = await fetch(`${env.BASICOS_API_URL}/v1/connections`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return c.json([]);
    return c.json(await res.json());
  });

  // Initiate OAuth — fetches the provider URL and redirects the browser
  app.get("/:provider/authorize", authMiddleware(auth), async (c) => {
    const session = c.get("session") as { user?: { id: string } };
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const provider = c.req.param("provider");
    const apiKey = await getSalesApiKey(userId);
    if (!apiKey) return c.json({ error: "Basics API key not configured" }, 400);

    const res = await fetch(
      `${env.BASICOS_API_URL}/v1/connections/${provider}/authorize`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!res.ok) {
      const text = await res.text();
      return c.json({ error: text }, 400);
    }

    const { url } = (await res.json()) as { url: string };
    return c.redirect(url);
  });

  // Delete / disconnect a provider
  app.delete("/:provider", authMiddleware(auth), async (c) => {
    const session = c.get("session") as { user?: { id: string } };
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const provider = c.req.param("provider");
    const apiKey = await getSalesApiKey(userId);
    if (!apiKey) return c.json({ error: "Basics API key not configured" }, 400);

    const res = await fetch(`${env.BASICOS_API_URL}/v1/connections/${provider}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return c.json({ error: "Failed to delete connection" }, 500);
    return c.json({ ok: true });
  });

  return app;
}

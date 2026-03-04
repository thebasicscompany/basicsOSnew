import { describe, expect, it, vi } from "vitest";
import { createViewRoutes } from "./views.js";

vi.mock("../middleware/auth.js", () => ({
  authMiddleware: () => async (c: any, next: () => Promise<void>) => {
    c.set("session", { user: { id: "user-1" } });
    await next();
  },
}));

vi.mock("../lib/rbac.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/rbac.js")>();
  return {
    ...actual,
    requirePermission: vi.fn().mockResolvedValue({
      ok: true,
      crmUser: { id: 11, organizationId: "org-1" },
      permissions: new Set(["*"]),
    }),
  };
});

function makeDbWithSelectQueue(queue: unknown[][]) {
  let i = 0;
  const nextResult = () => Promise.resolve((queue[i++] ?? []) as any);

  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => nextResult()),
        orderBy: vi.fn(() => nextResult()),
      })),
      orderBy: vi.fn(() => nextResult()),
    })),
  }));

  return {
    select,
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([])),
    })),
    execute: vi.fn(() => Promise.resolve([])),
  } as any;
}

describe("views route decomposition wiring", () => {
  it("returns 404 for foreign view on sorts endpoint", async () => {
    const db = makeDbWithSelectQueue([
      [{ id: 11, organizationId: "org-1" }], // crm user lookup
      [], // ownership check
    ]);
    const app = createViewRoutes(db, {} as any);

    const res = await app.request("http://localhost/view/view-foreign/sorts");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "View not found" });
  });

  it("returns 404 for foreign view on filters endpoint", async () => {
    const db = makeDbWithSelectQueue([
      [{ id: 11, organizationId: "org-1" }],
      [],
    ]);
    const app = createViewRoutes(db, {} as any);

    const res = await app.request(
      "http://localhost/view/view-foreign/filters",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fk_column_id: "name",
          comparison_op: "eq",
          value: "Acme",
        }),
      },
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "View not found" });
  });

  it("returns 404 for foreign view on rename endpoint", async () => {
    const db = makeDbWithSelectQueue([
      [{ id: 11, organizationId: "org-1" }],
      [],
    ]);
    const app = createViewRoutes(db, {} as any);

    const res = await app.request("http://localhost/view/view-foreign", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Renamed" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "View not found" });
  });
});

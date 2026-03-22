/** Shared helpers for org / desktop API base URL (Electron org-config.json + web override). */

export function normalizeOrgApiUrl(input: string): string {
  let s = input.trim();
  if (!s) throw new Error("URL is required");
  s = s.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  const path =
    u.pathname === "/" || u.pathname === ""
      ? ""
      : u.pathname.replace(/\/+$/, "");
  return `${u.origin}${path}`;
}

export type ProbeApiUrlResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

const HEALTH_TIMEOUT_MS = 15_000;

/** Probes GET {base}/health from the browser (subject to CORS). Prefer Electron IPC when available. */
export async function probeApiUrlFromRenderer(
  rawUrl: string,
): Promise<ProbeApiUrlResult> {
  let normalized: string;
  try {
    normalized = normalizeOrgApiUrl(rawUrl);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid URL",
    };
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${normalized}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return {
        ok: false,
        error: `Server returned ${res.status} ${res.statusText}`,
      };
    }
    return { ok: true, normalized };
  } catch (e) {
    clearTimeout(t);
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Connection timed out" };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach server",
    };
  }
}

/** Same-origin / dev proxy: when API base is empty, hit /health on the page origin. */
export async function probeSameOriginHealth(): Promise<ProbeApiUrlResult> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch("/health", {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return {
        ok: false,
        error: `Server returned ${res.status} ${res.statusText}`,
      };
    }
    return { ok: true, normalized: "" };
  } catch (e) {
    clearTimeout(t);
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Connection timed out" };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach server",
    };
  }
}

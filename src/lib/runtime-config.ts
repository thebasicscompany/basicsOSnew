const RUNTIME_API_STORAGE_KEY = "basicsos_runtime_api_url";

/**
 * Returns the API base URL for the current runtime (no trailing slash).
 * Callers can safely append paths, e.g. `${getRuntimeApiUrl()}/api/...`.
 *
 * Priority order:
 *  1. window.__runtimeApiUrl__ — injected synchronously by the Electron preload
 *     from the main process, which reads userData/org-config.json.  This value
 *     is persisted across auto-updates so every org keeps its own URL.
 *  2. localStorage (web only) — user-chosen server URL for self-hosted / switching.
 *  3. import.meta.env.VITE_API_URL — baked in at build time (used in web / dev).
 *  4. Empty string fallback (relative URLs, dev proxy).
 */
export function getRuntimeApiUrl(): string {
  let url: string;
  if (typeof window !== "undefined" && window.__runtimeApiUrl__) {
    url = window.__runtimeApiUrl__;
  } else if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(RUNTIME_API_STORAGE_KEY)?.trim();
      if (stored) url = stored;
      else url = import.meta.env.VITE_API_URL ?? "";
    } catch {
      url = import.meta.env.VITE_API_URL ?? "";
    }
  } else {
    url = import.meta.env.VITE_API_URL ?? "";
  }
  return url.replace(/\/+$/, "");
}

/** Persist API base URL for the web app (full page reload required for auth client). */
export function setRuntimeApiUrlOverride(url: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (url === null || url === "") {
      localStorage.removeItem(RUNTIME_API_STORAGE_KEY);
    } else {
      localStorage.setItem(
        RUNTIME_API_STORAGE_KEY,
        url.replace(/\/+$/, ""),
      );
    }
  } catch {
    // ignore quota / private mode
  }
}

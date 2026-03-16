/**
 * Resolves the API base URL for both web and Electron environments.
 *
 * - Web: uses VITE_API_URL env var (baked at build time), falls back to "" (same-origin).
 * - Electron (packaged): reads window.__ELECTRON_API_URL__ which is injected
 *   into the HTML by the main process protocol handler. This is available
 *   synchronously before any modules initialize.
 */

const VITE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// In packaged Electron, the main process injects this global into the HTML
// via the app:// protocol handler. Available synchronously at module load time.
const ELECTRON_URL =
  ((window as unknown as { __ELECTRON_API_URL__?: string }).__ELECTRON_API_URL__ ?? "").replace(/\/+$/, "");

/**
 * Returns the API URL synchronously (no trailing slash).
 * In Electron: reads the injected global (set by main process).
 * On web: reads VITE_API_URL (baked at build time).
 */
export function getApiUrlSync(): string {
  return ELECTRON_URL || VITE_URL;
}

/**
 * Async version — kept for compatibility. Resolves immediately since the
 * URL is now available synchronously.
 */
export function getApiUrl(): Promise<string> {
  return Promise.resolve(getApiUrlSync());
}

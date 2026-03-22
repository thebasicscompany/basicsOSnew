import { authClient } from "@/lib/auth-client";
import { probeApiUrlFromRenderer } from "@/lib/org-api-url";
import { setRuntimeApiUrlOverride } from "@/lib/runtime-config";

/**
 * Validates the URL, persists it (Electron: org-config.json + relaunch; web: localStorage + reload),
 * and signs the user out so they see the sign-in flow for the new server.
 */
export async function applyServerUrlFromUi(rawUrl: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a server URL" };
  }

  if (import.meta.env.VITE_IS_ELECTRON && window.electronAPI?.applyOrgApiUrl) {
    const r = await window.electronAPI.applyOrgApiUrl(trimmed);
    if (!r.ok) {
      return { ok: false, error: r.error ?? "Could not switch server" };
    }
    return { ok: true };
  }

  const probe = await probeApiUrlFromRenderer(trimmed);
  if (!probe.ok) {
    return { ok: false, error: probe.error };
  }
  setRuntimeApiUrlOverride(probe.normalized);
  try {
    await authClient.signOut();
  } catch {
    // session may already be invalid if the previous server was down
  }
  window.location.reload();
  return { ok: true };
}

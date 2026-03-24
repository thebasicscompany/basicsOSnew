"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  probeApiUrlFromRenderer,
  probeSameOriginHealth,
  type ProbeApiUrlResult,
} from "@/lib/org-api-url";
import { getRuntimeApiUrl } from "@/lib/runtime-config";
import { ServerConfigPage } from "./ServerConfigPage";
import { Spinner } from "@/components/ui/spinner";

async function probeCurrentServer(): Promise<ProbeApiUrlResult> {
  const base = getRuntimeApiUrl();
  if (!base) {
    return probeSameOriginHealth();
  }
  if (import.meta.env.VITE_IS_ELECTRON && window.electronAPI?.probeApiUrl) {
    const r = await window.electronAPI.probeApiUrl(base);
    if (r.ok) {
      return { ok: true, normalized: r.normalized ?? base };
    }
    return { ok: false, error: r.error ?? "Could not reach server" };
  }
  return probeApiUrlFromRenderer(base);
}

/**
 * Blocks the app until the configured API responds to GET /health, or shows
 * {@link ServerConfigPage} so the user can fix or switch the server URL.
 */
export function ServerHealthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"check" | "ok" | "fail">("check");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const apiUrl = getRuntimeApiUrl();
      if (
        import.meta.env.VITE_IS_ELECTRON &&
        apiUrl === ""
      ) {
        if (cancelled) return;
        setError("No server configured. Enter your organization's server link below.");
        setPhase("fail");
        return;
      }
      const result = await probeCurrentServer();
      if (cancelled) return;
      if (result.ok) {
        setPhase("ok");
      } else {
        setError(result.error);
        setPhase("fail");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "check") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Connecting…</p>
      </div>
    );
  }

  if (phase === "fail") {
    return <ServerConfigPage initialError={error} />;
  }

  return <>{children}</>;
}

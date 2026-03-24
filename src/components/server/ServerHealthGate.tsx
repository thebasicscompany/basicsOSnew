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

const BLANK_SERVER_MSG =
  "No server configured. Enter your organization's server link below.";

/**
 * Blocks the app until the configured API responds to GET /health, or shows
 * {@link ServerConfigPage} so the user can fix or switch the server URL.
 */
export function ServerHealthGate({ children }: { children: ReactNode }) {
  const apiUrl = getRuntimeApiUrl();
  const isBlankConfig =
    import.meta.env.VITE_IS_ELECTRON === "true" && apiUrl === "";

  const [phase, setPhase] = useState<"check" | "ok" | "fail">(
    isBlankConfig ? "fail" : "check",
  );
  const [error, setError] = useState<string | null>(
    isBlankConfig ? BLANK_SERVER_MSG : null,
  );

  useEffect(() => {
    if (isBlankConfig) return;
    let cancelled = false;
    void (async () => {
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
  }, [isBlankConfig]);

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

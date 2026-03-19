import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type UpdateState =
  | { status: "idle" }
  | { status: "available"; version: string }
  | { status: "downloading"; version: string; percent: number }
  // macOS only: electron-updater zip is done but Squirrel.Mac is still staging
  | { status: "squirrel-preparing"; version: string }
  | { status: "ready"; version: string }
  | { status: "error"; version: string; message: string };

export function AppUpdateBanner() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });
  const isElectron = import.meta.env.VITE_IS_ELECTRON;
  const updater = typeof window !== "undefined" ? window.electronAPI?.updater : undefined;

  const isMacElectron =
    isElectron && typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac");

  useEffect(() => {
    if (!isElectron || !updater) return;

    updater.onUpdateAvailable((info) => {
      setState({ status: "available", version: info.version });
    });
    updater.onUpdateProgress((progress) => {
      setState((prev) =>
        prev.status === "available" || prev.status === "downloading"
          ? { status: "downloading", version: prev.version, percent: progress.percent ?? 0 }
          : prev.status === "idle"
            ? { status: "downloading", version: "?", percent: progress.percent ?? 0 }
            : prev,
      );
    });
    updater.onUpdateDownloaded(({ squirrelReady }) => {
      setState((prev) => {
        const version = prev.status !== "idle" ? prev.version : "?";
        // On macOS, Squirrel.Mac still needs to stage the update via its local proxy
        // server before restart is safe. Show a "Preparing…" state until it signals
        // ready. On all other platforms the update is immediately installable.
        if (isMacElectron && !squirrelReady) {
          return { status: "squirrel-preparing", version };
        }
        return { status: "ready", version };
      });
    });
    updater.onSquirrelReady?.(() => {
      setState((prev) =>
        prev.status !== "idle" ? { status: "ready", version: prev.version } : prev,
      );
    });
    updater.onUpdateError?.((data) => {
      setState((prev) =>
        prev.status === "squirrel-preparing" || prev.status === "downloading"
          ? { status: "error", version: prev.version, message: data.message }
          : prev,
      );
    });
  }, [isElectron, updater, isMacElectron]);

  const handleRestart = () => {
    window.electronAPI?.updater?.installUpdate?.();
  };

  if (state.status === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-border bg-surface-card px-4 py-2 text-sm",
        isMacElectron && "pt-12",
      )}
    >
      {state.status === "downloading" && (
        <>
          <span className="text-muted-foreground">Updating…</span>
          <Progress value={state.percent} className="h-2 w-32" />
          <span className="text-muted-foreground tabular-nums">{Math.round(state.percent)}%</span>
        </>
      )}
      {state.status === "squirrel-preparing" && (
        <>
          <CircleNotchIcon className="size-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Preparing update v{state.version}…</span>
        </>
      )}
      {state.status === "ready" && (
        <>
          <span className="text-muted-foreground">
            Update ready (v{state.version}). Restart to apply.
          </span>
          <Button size="sm" variant="default" onClick={handleRestart}>
            Restart now
          </Button>
        </>
      )}
      {state.status === "error" && (
        <span className="text-destructive">Update failed. Please restart the app and try again.</span>
      )}
      {state.status === "available" && (
        <span className="text-muted-foreground">Downloading update…</span>
      )}
    </div>
  );
}

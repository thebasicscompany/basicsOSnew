import { useCallback, useMemo, useState } from "react";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  getHelpShortcuts,
  getOnboardingChecklistItems,
} from "@/components/help/help-content";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useMe } from "@/hooks/use-me";
import { useConfiguredShortcuts } from "@/hooks/use-configured-shortcuts";
import { readWizardCompletedSteps } from "@/lib/wizard-storage";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export type HelpCenterMode = "help" | "onboarding";

type HelpCenterDialogProps = {
  open: boolean;
  mode: HelpCenterMode;
  onOpenChange: (open: boolean) => void;
  onReplayOnboarding: () => void;
};

type Connection = { provider: string };
const API_URL = import.meta.env.VITE_API_URL ?? "";

export function HelpCenterDialog({
  open,
  onOpenChange,
}: HelpCenterDialogProps) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { hasCompletedOnboarding, restartOnboarding, isRestartingOnboarding } = useOnboarding();
  const isAdmin = Boolean(me?.administrator);
  const hasApiKey = Boolean(me?.hasApiKey);
  const configuredShortcuts = useConfiguredShortcuts();

  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const checklistItems = useMemo(
    () => getOnboardingChecklistItems({ isAdmin, hasApiKey }),
    [hasApiKey, isAdmin],
  );
  const helpShortcuts = useMemo(
    () => getHelpShortcuts(configuredShortcuts),
    [configuredShortcuts],
  );

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: () =>
      fetch(`${API_URL}/api/connections`, { credentials: "include" }).then(
        (r) => (r.ok ? (r.json() as Promise<Connection[]>) : []),
      ),
    enabled: open,
  });

  const completedIds = useMemo(() => {
    const wizardIds =
      me?.id ? readWizardCompletedSteps(me.id) : [];
    const connectedProviders = new Set(
      connections.map((c) => c.provider),
    );
    const ids = new Set<string>([...visitedIds, ...wizardIds]);
    if (connectedProviders.has("google")) ids.add("connect-gmail");
    if (ids.has("shortcuts") || ids.has("voice-setup"))
      ids.add("configure-shortcuts");
    return ids;
  }, [connections, visitedIds, me?.id]);

  const handleNavigate = useCallback(
    (itemId: string, path: string) => {
      setVisitedIds((prev) =>
        prev.includes(itemId) ? prev : [...prev, itemId],
      );
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  const handleRestartSetup = useCallback(async () => {
    try {
      await restartOnboarding();
      onOpenChange(false);
      navigate("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restart setup");
    }
  }, [restartOnboarding, onOpenChange, navigate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 pt-5 pb-4 text-left">
          <DialogTitle className="text-base font-semibold">
            Help Center
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            BasicsOS quick reference
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          {/* ── Getting started ─────────────────────────────────────────── */}
          {!hasCompletedOnboarding && (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Getting started
                </p>
                <div className="space-y-0.5">
                  {checklistItems.map((item) => {
                    const done = completedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleNavigate(item.id, item.action.path)
                        }
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                          done && "opacity-60",
                        )}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {done ? (
                            <CheckCircleIcon
                              weight="fill"
                              className="size-4 shrink-0 text-primary"
                            />
                          ) : (
                            <CircleIcon className="size-4 shrink-0 text-muted-foreground/50" />
                          )}
                          <span
                            className={cn(
                              "truncate font-medium",
                              done && "line-through text-muted-foreground",
                            )}
                          >
                            {item.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {done ? "Revisit →" : item.action.label + " →"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* ── Shortcuts ───────────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Shortcuts
            </p>
            <div className="space-y-0.5">
              {helpShortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{shortcut.label}</span>
                  <KbdGroup>
                    {shortcut.keys.map((key) => (
                      <Kbd key={`${shortcut.label}-${key}`}>{key}</Kbd>
                    ))}
                  </KbdGroup>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-3 flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleRestartSetup()}
            disabled={isRestartingOnboarding}
          >
            {isRestartingOnboarding ? "Restarting…" : "Restart setup"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "basics-os/src/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "basics-os/src/components/ui/sheet";
import { Badge } from "basics-os/src/components/ui/badge";
import { Button } from "basics-os/src/components/ui/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

export interface WorkflowStep {
  nodeId: string;
  type: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  outputKey?: string;
  output?: unknown;
  error?: string;
}

export interface AutomationRun {
  id: number;
  ruleId: number;
  salesId: number;
  status: "running" | "success" | "error";
  result: unknown;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface AutomationRunsPanelProps {
  ruleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationRunsPanel({ ruleId, open, onOpenChange }: AutomationRunsPanelProps) {
  const queryClient = useQueryClient();

  const { data: runs = [], isPending } = useQuery({
    queryKey: ["automation-runs", ruleId],
    queryFn: () =>
      fetchApi<AutomationRun[]>(
        `/api/automation-runs?ruleId=${ruleId}&limit=20`
      ),
    enabled: !!ruleId && open,
  });

  const rerun = useMutation({
    mutationFn: (rid: number) =>
      fetchApi<{ ok: boolean }>("/api/automation-runs/trigger", {
        method: "POST",
        body: JSON.stringify({ ruleId: rid }),
      }),
    onSuccess: () => {
      toast.success("Re-run triggered");
      queryClient.invalidateQueries({ queryKey: ["automation-runs", ruleId] });
    },
    onError: () => toast.error("Failed to trigger re-run"),
  });

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "—";
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    const ms = b - a;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Run History</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            runs.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                formatDuration={formatDuration}
                onRerun={() => ruleId && rerun.mutate(ruleId)}
                rerunPending={rerun.isPending}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function stepTypeLabel(type: string): string {
  const map: Record<string, string> = {
    trigger_event: "Event Trigger",
    trigger_schedule: "Schedule Trigger",
    action_email: "Send Email",
    action_ai: "AI Task",
    action_web_search: "Web Search",
    action_crm: "CRM Action",
    action_slack: "Slack Message",
    action_gmail_read: "Gmail Read",
    action_gmail_send: "Gmail Send",
    action_ai_agent: "AI Agent",
    action_condition: "Condition",
  };
  return map[type] ?? type;
}

function RunRow({
  run,
  formatDuration,
  onRerun,
  rerunPending,
}: {
  run: AutomationRun;
  formatDuration: (start: string, end: string | null) => string;
  onRerun: () => void;
  rerunPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedStepIdx, setExpandedStepIdx] = useState<number | null>(null);
  const result = run.result as Record<string, unknown> | null;
  const steps = (result?._steps ?? []) as WorkflowStep[];

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              run.status === "success"
                ? "default"
                : run.status === "error"
                  ? "destructive"
                  : "secondary"
            }
          >
            {run.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(run.startedAt).toLocaleString()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          title="Re-run"
          onClick={onRerun}
          disabled={rerunPending}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Duration: {formatDuration(run.startedAt, run.finishedAt)}
      </div>

      {/* Steps timeline */}
      {steps.length > 0 && (
        <div className="space-y-1 pt-1">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 text-xs text-left hover:bg-muted/50 rounded px-1 py-0.5"
                onClick={() => setExpandedStepIdx(expandedStepIdx === idx ? null : idx)}
              >
                <span className={step.error ? "text-destructive" : "text-green-600"}>
                  {step.error ? "✗" : "✓"}
                </span>
                <span className="font-medium">{stepTypeLabel(step.type)}</span>
                <span className="text-muted-foreground ml-auto">
                  {step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`}
                </span>
                {step.outputKey && !step.error && (
                  <span className="text-muted-foreground/60">▾</span>
                )}
              </button>
              {expandedStepIdx === idx && (
                <div className="ml-4">
                  {step.error ? (
                    <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-auto max-h-32">
                      {step.error}
                    </pre>
                  ) : step.output !== undefined ? (
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No output</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="text-xs text-primary hover:underline"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
          {run.error
            ? JSON.stringify({ error: run.error }, null, 2)
            : JSON.stringify(result ?? {}, null, 2)}
        </pre>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "basics-os/src/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "basics-os/src/components/ui/sheet";
import { Badge } from "basics-os/src/components/ui/badge";

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
  const { data: runs = [], isPending } = useQuery({
    queryKey: ["automation-runs", ruleId],
    queryFn: () =>
      fetchApi<AutomationRun[]>(
        `/api/automation-runs?ruleId=${ruleId}&limit=20`
      ),
    enabled: !!ruleId && open,
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
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RunRow({
  run,
  formatDuration,
}: {
  run: AutomationRun;
  formatDuration: (start: string, end: string | null) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
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
      <div className="text-xs text-muted-foreground">
        Duration: {formatDuration(run.startedAt, run.finishedAt)}
      </div>
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
            : JSON.stringify(run.result ?? {}, null, 2)}
        </pre>
      )}
    </div>
  );
}


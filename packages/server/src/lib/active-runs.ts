export interface AgentEvent {
  event: string;
  stream?: string;
  data?: unknown;
  globalSeq?: number;
  sessionKey?: string;
}

export interface ActiveRun {
  sessionId: string;
  sessionKey: string;
  status: "running" | "waiting-for-subagents" | "completed" | "error";
  eventBuffer: AgentEvent[];
  subscribers: Set<(event: AgentEvent | null) => void>;
  lastGlobalSeq: number;
  startedAt: number;
  accumulated: {
    toolSteps: Array<{
      id: string;
      toolName: string;
      args?: unknown;
      result?: string;
      status: string;
    }>;
    textContent: string;
  };
}

const runs = ((globalThis as Record<string, unknown>).__basicsos_activeRuns ??=
  new Map<string, ActiveRun>()) as Map<string, ActiveRun>;

export function startRun(sessionId: string, sessionKey: string): ActiveRun {
  const run: ActiveRun = {
    sessionId,
    sessionKey,
    status: "running",
    eventBuffer: [],
    subscribers: new Set(),
    lastGlobalSeq: 0,
    startedAt: Date.now(),
    accumulated: { toolSteps: [], textContent: "" },
  };
  runs.set(sessionId, run);
  return run;
}

export function getActiveRun(sessionId: string): ActiveRun | undefined {
  return runs.get(sessionId);
}

export function subscribeToRun(
  sessionId: string,
  callback: (event: AgentEvent | null) => void,
  opts?: { replay?: boolean },
): () => void {
  const run = runs.get(sessionId);
  if (!run) {
    callback(null);
    return () => {};
  }

  // Replay buffered events if requested
  if (opts?.replay) {
    for (const event of run.eventBuffer) {
      callback(event);
    }
  }

  run.subscribers.add(callback);

  // If already completed, signal immediately
  if (run.status === "completed" || run.status === "error") {
    callback(null);
  }

  return () => {
    run.subscribers.delete(callback);
  };
}

export function processAgentEvent(sessionId: string, event: AgentEvent): void {
  const run = runs.get(sessionId);
  if (!run) return;

  run.eventBuffer.push(event);
  if (event.globalSeq) run.lastGlobalSeq = event.globalSeq;

  // Accumulate tool steps and text
  if (event.event === "tool_start" && event.data) {
    const d = event.data as Record<string, unknown>;
    run.accumulated.toolSteps.push({
      id: String(d.id ?? ""),
      toolName: String(d.toolName ?? ""),
      args: d.args,
      status: "running",
    });
  } else if (event.event === "tool_result" && event.data) {
    const d = event.data as Record<string, unknown>;
    const step = run.accumulated.toolSteps.find((s) => s.id === d.id);
    if (step) {
      step.status = d.success ? "complete" : "error";
      step.result = String(d.result ?? "");
    }
  } else if (event.event === "text_delta" && event.data) {
    run.accumulated.textContent += String(event.data);
  }

  // Broadcast to all subscribers
  for (const cb of run.subscribers) {
    cb(event);
  }
}

export function finalizeRun(
  sessionId: string,
  status: "completed" | "error",
): void {
  const run = runs.get(sessionId);
  if (!run) return;

  run.status = status;
  for (const cb of run.subscribers) {
    cb(null); // Signal end
  }
  run.subscribers.clear();

  // Schedule cleanup after 5 minutes
  setTimeout(() => {
    runs.delete(sessionId);
  }, 5 * 60 * 1000);
}

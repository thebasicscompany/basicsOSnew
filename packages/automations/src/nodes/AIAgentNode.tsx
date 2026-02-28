import type { NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface AIAgentData {
  objective?: string;
  model?: string;
  maxSteps?: number;
}

export function AIAgentNode({
  data,
  selected,
}: NodeProps<{ type: "action_ai_agent"; data: AIAgentData }>) {
  const objective = data?.objective?.trim() || "";
  const display =
    objective.length > 24 ? `${objective.slice(0, 24)}…` : objective || "AI Agent";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
      )}
      handles={{ target: true, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Sparkles className="size-5 text-purple-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">AI Agent</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

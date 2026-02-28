import type { NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface AIActionData {
  prompt?: string;
  model?: string;
}

export function AIActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_ai"; data: AIActionData }>) {
  const prompt = data?.prompt?.trim() || "";
  const display = prompt.length > 24 ? `${prompt.slice(0, 24)}…` : prompt || "AI Task";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: true, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Zap className="size-5 text-amber-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">AI Task</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

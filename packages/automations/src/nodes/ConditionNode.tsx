import type { NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface ConditionData {
  field?: string;
  operator?: string;
  value?: string;
}

export function ConditionNode({
  data,
  selected,
}: NodeProps<{ type: "action_condition"; data: ConditionData }>) {
  const field = data?.field?.trim() || "";
  const operator = data?.operator?.trim() || "";
  const value = data?.value?.trim() || "";
  const display =
    field && operator
      ? `${field} ${operator}${value ? ` ${value}` : ""}`
      : "Set condition";
  const isInvalid = !field || !operator;

  return (
    <WorkflowNode
      className={cn(
        "relative flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: true, source: true }}
    >
      {isInvalid && (
        <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] text-white">!</span>
      )}
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <GitBranch className="size-5 text-teal-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Condition</NodeTitle>
          <NodeDescription className="text-xs truncate max-w-[120px]">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

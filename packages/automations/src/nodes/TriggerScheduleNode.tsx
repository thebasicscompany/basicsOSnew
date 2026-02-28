import type { NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface TriggerScheduleData {
  cron?: string;
  label?: string;
}

export function TriggerScheduleNode({
  data,
  selected,
}: NodeProps<{ type: "trigger_schedule"; data: TriggerScheduleData }>) {
  const label = data?.label?.trim() || (data?.cron ? `Cron: ${data.cron}` : "Schedule");

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: false, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Clock className="size-5 text-blue-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">{label}</NodeTitle>
          <NodeDescription className="text-xs">Schedule</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

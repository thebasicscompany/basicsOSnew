import type { NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

const EVENT_OPTIONS = [
  "deal.created",
  "deal.updated",
  "deal.deleted",
  "contact.created",
  "contact.updated",
  "task.created",
] as const;

export interface TriggerEventData {
  event?: string;
}

export function TriggerEventNode({
  data,
  selected,
}: NodeProps<{ type: "trigger_event"; data: TriggerEventData }>) {
  const event = data?.event ?? "deal.created";
  const displayTitle =
    EVENT_OPTIONS.includes(event as (typeof EVENT_OPTIONS)[number])
      ? event.replace(".", " ")
      : "Deal created";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: false, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Play className="size-5 text-blue-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">{displayTitle}</NodeTitle>
          <NodeDescription className="text-xs">Trigger</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

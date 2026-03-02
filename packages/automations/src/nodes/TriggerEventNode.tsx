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
  const event = data?.event ?? "";
  const displayTitle = event ? event.replace(".", " ") : "Pick event";
  const isInvalid = !event;

  return (
    <WorkflowNode
      className={cn(
        "relative flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: false, source: true }}
    >
      {isInvalid && (
        <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] text-white">!</span>
      )}
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

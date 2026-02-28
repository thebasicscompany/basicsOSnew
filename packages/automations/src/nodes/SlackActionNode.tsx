import type { NodeProps } from "@xyflow/react";
import { MessageSquare } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface SlackActionData {
  channel?: string;
  message?: string;
}

export function SlackActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_slack"; data: SlackActionData }>) {
  const channel = data?.channel?.trim() || "";
  const display = channel
    ? channel.length > 20
      ? `${channel.slice(0, 20)}…`
      : channel
    : "Slack Message";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
      )}
      handles={{ target: true, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <MessageSquare className="size-5 text-blue-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Slack Message</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

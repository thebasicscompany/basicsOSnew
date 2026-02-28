import type { NodeProps } from "@xyflow/react";
import { Inbox } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface GmailReadData {
  query?: string;
  maxResults?: number;
}

export function GmailReadNode({
  data,
  selected,
}: NodeProps<{ type: "action_gmail_read"; data: GmailReadData }>) {
  const query = data?.query?.trim() || "";
  const display = query
    ? query.length > 20
      ? `${query.slice(0, 20)}…`
      : query
    : "Read Emails";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
      )}
      handles={{ target: true, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Inbox className="size-5 text-red-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Gmail Read</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

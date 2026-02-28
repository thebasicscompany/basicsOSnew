import type { NodeProps } from "@xyflow/react";
import { Send } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface GmailSendData {
  to?: string;
  subject?: string;
  body?: string;
}

export function GmailSendNode({
  data,
  selected,
}: NodeProps<{ type: "action_gmail_send"; data: GmailSendData }>) {
  const to = data?.to?.trim() || "";
  const display = to
    ? to.length > 20
      ? `${to.slice(0, 20)}…`
      : to
    : "Send Email (Gmail)";

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary",
      )}
      handles={{ target: true, source: true }}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-3">
        <Send className="size-5 text-red-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Gmail Send</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

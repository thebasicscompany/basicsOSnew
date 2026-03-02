import type { NodeProps } from "@xyflow/react";
import { Mail } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface EmailActionData {
  to?: string;
  subject?: string;
  body?: string;
}

export function EmailActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_email"; data: EmailActionData }>) {
  const to = data?.to?.trim() || "";
  const display = to ? (to.length > 20 ? `${to.slice(0, 20)}…` : to) : "Send Email";
  const isInvalid = !data?.to || !data?.subject;

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
        <Mail className="size-5 text-amber-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Send Email</NodeTitle>
          <NodeDescription className="text-xs">{display}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

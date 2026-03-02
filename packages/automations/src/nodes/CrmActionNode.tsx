import type { NodeProps } from "@xyflow/react";
import { ListTodo } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface CrmActionData {
  action?: string;
  params?: { text?: string; type?: string; contactId?: number };
}

export function CrmActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_crm"; data: CrmActionData }>) {
  const action = data?.action ?? "";
  const label = action === "create_task" ? "Create task" : action || "CRM Action";
  const isInvalid = !data?.action;

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
        <ListTodo className="size-5 text-green-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">CRM Action</NodeTitle>
          <NodeDescription className="text-xs">{label}</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

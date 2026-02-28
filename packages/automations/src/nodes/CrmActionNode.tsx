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
  const action = data?.action ?? "create_task";
  const label = action === "create_task" ? "Create task" : action;

  return (
    <WorkflowNode
      className={cn(
        "flex w-40 flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        selected && "border-primary"
      )}
      handles={{ target: true, source: true }}
    >
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

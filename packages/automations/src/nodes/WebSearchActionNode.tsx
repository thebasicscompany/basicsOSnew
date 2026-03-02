import type { NodeProps } from "@xyflow/react";
import { Search } from "lucide-react";
import {
  WorkflowNode,
  NodeTitle,
  NodeDescription,
} from "basics-os/src/components/ai-elements/node";
import { cn } from "basics-os/src/lib/utils";

export interface WebSearchActionData {
  query?: string;
  numResults?: number;
}

export function WebSearchActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_web_search"; data: WebSearchActionData }>) {
  const query = data?.query?.trim() || "";
  const display = query.length > 20 ? `${query.slice(0, 20)}…` : query || "Web Search";
  const num = data?.numResults ?? 5;
  const isInvalid = !data?.query;

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
        <Search className="size-5 text-blue-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-sm">Web Search</NodeTitle>
          <NodeDescription className="text-xs">{display} ({num})</NodeDescription>
        </div>
      </div>
    </WorkflowNode>
  );
}

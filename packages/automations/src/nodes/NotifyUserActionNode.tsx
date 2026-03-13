import { BellIcon } from "@phosphor-icons/react";
import type { NodeProps } from "@xyflow/react";
import { CompactAutomationNode } from "./CompactAutomationNode";

export interface NotifyUserActionData {
  title?: string;
  body?: string;
  context?: string;
}

export function NotifyUserActionNode({
  data,
  selected,
}: NodeProps<{ type: "action_notify_user"; data: NotifyUserActionData }>) {
  const title = data?.title?.trim() || "";
  const display =
    title.length > 24 ? `${title.slice(0, 24)}…` : title || "Notify User";

  return (
    <CompactAutomationNode
      icon={<BellIcon className="size-4 text-violet-400" />}
      title="Notify User"
      description={display}
      handles={{ target: true, source: true }}
      selected={selected}
    />
  );
}

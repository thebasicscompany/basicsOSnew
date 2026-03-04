import type { ReactNode } from "react";
import { AutomationBuilderContext } from "./automation-builder-context";
import type { AutomationBuilderContextValue } from "./use-automation-builder";

export function AutomationBuilderProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AutomationBuilderContextValue;
}) {
  return (
    <AutomationBuilderContext.Provider value={value}>
      {children}
    </AutomationBuilderContext.Provider>
  );
}

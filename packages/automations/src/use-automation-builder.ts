import { useContext } from "react";
import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "./builderConstants";
import { AutomationBuilderContext } from "./automation-builder-context";

export interface AutomationBuilderContextValue {
  connectedProviders: string[];
  nodes: WorkflowNode[];
  edges: Edge[];
  nodeTypeLabels: Record<string, string>;
}

export function useAutomationBuilder(): AutomationBuilderContextValue {
  const ctx = useContext(AutomationBuilderContext);
  return (
    ctx ?? {
      connectedProviders: [],
      nodes: [],
      edges: [],
      nodeTypeLabels: {},
    }
  );
}

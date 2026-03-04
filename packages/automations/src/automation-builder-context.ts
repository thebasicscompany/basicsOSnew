import { createContext } from "react";
import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "./builderConstants";

export interface AutomationBuilderContextValue {
  connectedProviders: string[];
  nodes: WorkflowNode[];
  edges: Edge[];
  nodeTypeLabels: Record<string, string>;
}

export const AutomationBuilderContext =
  createContext<AutomationBuilderContextValue | null>(null);

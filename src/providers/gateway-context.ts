import { createContext, useContext } from "react";
import type { ApiClient, ManageClient } from "@/lib/gateway";

export interface GatewayContextValue {
  apiKey: string | null;
  hasKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  apiClient: ApiClient | null;
  manageClient: ManageClient | null;
  gatewayUrl: string;
}

export const GatewayContext = createContext<GatewayContextValue | null>(null);

export function useGateway(): GatewayContextValue {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error("useGateway must be used within GatewayProvider");
  }
  return ctx;
}

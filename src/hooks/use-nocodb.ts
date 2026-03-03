import { useContext, createContext } from "react";

interface NocoDBConfig {
  baseUrl: string;
  token: string;
  tableMap: Record<string, string>;
  salesId: number;
}

export interface NocoDBContextValue {
  ready: boolean;
  config: NocoDBConfig | null;
  error: string | null;
}

export const NocoDBContext = createContext<NocoDBContextValue>({
  ready: false,
  config: null,
  error: null,
});

export function useNocoDB() {
  return useContext(NocoDBContext);
}

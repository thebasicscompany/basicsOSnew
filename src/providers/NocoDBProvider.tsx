import { useEffect, useState, type ReactNode } from "react";
import { fetchApi } from "@/lib/api";
import { configureNocoClient } from "@/lib/nocodb/client";
import { configureTableMap } from "@/lib/nocodb/table-map";
import { setNocoSalesId } from "@/lib/api/crm-nocodb";
import { NocoDBContext, type NocoDBContextValue } from "@/hooks/use-nocodb";

interface NocoDBConfig {
  baseUrl: string;
  token: string;
  tableMap: Record<string, string>;
  salesId: number;
}

export function NocoDBProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NocoDBContextValue>({
    ready: false,
    config: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetchApi<NocoDBConfig>("/api/nocodb-config")
      .then((config) => {
        if (cancelled) return;
        configureNocoClient(config.baseUrl, config.token);
        configureTableMap(config.tableMap);
        setNocoSalesId(config.salesId);
        setState({ ready: true, config, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[NocoDB] Failed to load config:", message);
        setState({ ready: false, config: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Failed to connect to database</p>
          <p className="text-sm text-muted-foreground">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Connecting to database...</p>
      </div>
    );
  }

  return (
    <NocoDBContext.Provider value={state}>{children}</NocoDBContext.Provider>
  );
}

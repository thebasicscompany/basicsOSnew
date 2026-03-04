import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authClient } from "@/lib/auth";
import {
  createApiClient,
  createManageClient,
  type ApiClient,
  type ManageClient,
} from "@/lib/gateway";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL ?? "https://api.basicsos.com";

const VALID_PREFIXES = ["bos_live_sk_", "bos_test_sk_"] as const;

function isValidApiKey(key: string): boolean {
  return VALID_PREFIXES.some((p) => key.startsWith(p));
}

export interface GatewayContextValue {
  apiKey: string | null;
  hasKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  apiClient: ApiClient | null;
  manageClient: ManageClient | null;
  gatewayUrl: string;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [manageToken, setManageToken] = useState<string | null>(null);

  // Never persist raw API key client-side; keep it in memory only.
  useEffect(() => {
    if (!userId) {
      setApiKeyState(null);
      setHasServerKey(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setHasServerKey(false);
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/api/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { hasApiKey?: boolean } | null) => {
        if (!cancelled) setHasServerKey(Boolean(data?.hasApiKey));
      })
      .catch(() => {
        if (!cancelled) setHasServerKey(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Fetch manage token when session exists
  useEffect(() => {
    if (!userId) {
      setManageToken(null);
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/api/gateway-token`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { token?: string } | null) => {
        if (!cancelled && data?.token) setManageToken(data.token);
      })
      .catch(() => {
        if (!cancelled) setManageToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setApiKey = useCallback(
    (key: string) => {
      if (!isValidApiKey(key)) {
        throw new Error(
          "API key must start with bos_live_sk_ or bos_test_sk_",
        );
      }
      if (!userId) return;
      setApiKeyState(key);
      setHasServerKey(true);
    },
    [userId],
  );

  const clearApiKey = useCallback(() => {
    setApiKeyState(null);
    setHasServerKey(false);
  }, []);

  const apiClient = useMemo(() => {
    const key = apiKey?.trim();
    if (!key) return null;
    return createApiClient(key, GATEWAY_URL);
  }, [apiKey]);

  const manageClient = useMemo(() => {
    if (!manageToken) return null;
    return createManageClient(manageToken, GATEWAY_URL);
  }, [manageToken]);

  const value: GatewayContextValue = useMemo(
    () => ({
      apiKey,
      hasKey: Boolean(apiKey?.trim()) || hasServerKey,
      setApiKey,
      clearApiKey,
      apiClient,
      manageClient,
      gatewayUrl: GATEWAY_URL,
    }),
    [apiKey, hasServerKey, setApiKey, clearApiKey, apiClient, manageClient],
  );

  return (
    <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>
  );
}

export function useGateway(): GatewayContextValue {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error("useGateway must be used within GatewayProvider");
  }
  return ctx;
}

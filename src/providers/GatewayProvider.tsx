import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

const STORAGE_PREFIX = "bos_key_";

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
  const [manageToken, setManageToken] = useState<string | null>(null);

  const prevUserIdRef = useRef<string | null>(null);

  // Load API key from localStorage when user changes; clear on sign-out
  useEffect(() => {
    if (!userId) {
      if (prevUserIdRef.current) {
        localStorage.removeItem(`${STORAGE_PREFIX}${prevUserIdRef.current}`);
        prevUserIdRef.current = null;
      }
      setApiKeyState(null);
      return;
    }
    prevUserIdRef.current = userId;
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    setApiKeyState(stored && isValidApiKey(stored) ? stored : null);
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
      if (userId) {
        localStorage.setItem(`${STORAGE_PREFIX}${userId}`, key);
        setApiKeyState(key);
      }
    },
    [userId],
  );

  const clearApiKey = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
    }
    setApiKeyState(null);
  }, [userId]);

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
      hasKey: Boolean(apiKey?.trim()),
      setApiKey,
      clearApiKey,
      apiClient,
      manageClient,
      gatewayUrl: GATEWAY_URL,
    }),
    [apiKey, setApiKey, clearApiKey, apiClient, manageClient],
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

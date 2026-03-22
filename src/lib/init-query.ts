import { getRuntimeApiUrl } from "@/lib/runtime-config";

/** Shared key so every screen reads the same `/api/init` shape (incl. orgName). */
export const INIT_BOOTSTRAP_QUERY_KEY = ["bootstrap", "init"] as const;

export type InitBootstrap = {
  initialized: boolean;
  orgName?: string;
};

export async function fetchInitBootstrap(): Promise<InitBootstrap> {
  const apiUrl = getRuntimeApiUrl();
  const res = await fetch(`${apiUrl}/api/init`, { credentials: "include" });
  return res.json() as Promise<InitBootstrap>;
}

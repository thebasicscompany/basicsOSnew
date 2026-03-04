import { authClient } from "./auth-client";

/**
 * Hook to access the current session.
 * Returns { data: Session | null, isPending, error }.
 */
export function useSession() {
  return authClient.useSession();
}

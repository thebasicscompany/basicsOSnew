import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { LoginPage } from "./login-page";

import {
  fetchInitBootstrap,
  INIT_BOOTSTRAP_QUERY_KEY,
} from "@/lib/init-query";

/**
 * Entry point for the app. Handles three cases:
 *   1. Already logged in → /contacts
 *   2. Not initialized   → /sign-up (first-user setup)
 *   3. Initialized       → render LoginPage
 */
export function StartPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const { data: initData, isPending: initPending } = useQuery({
    queryKey: INIT_BOOTSTRAP_QUERY_KEY,
    queryFn: fetchInitBootstrap,
    retry: 1,
    // Only run after we know the session state
    enabled: !sessionPending && !session?.user,
  });

  const isInitialized = initData?.initialized ?? false;

  // Still resolving session or init
  if (sessionPending || (!session?.user && initPending)) return null;

  // Already authenticated
  if (session?.user) return <Navigate to="/dashboard" replace />;

  // First-time setup
  if (!isInitialized) return <Navigate to="/sign-up" replace />;

  return <LoginPage />;
}

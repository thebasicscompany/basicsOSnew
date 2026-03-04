import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { authClient } from "./auth-client";

/**
 * Wrapper that redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session?.user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

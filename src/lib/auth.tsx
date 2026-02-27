import type { ReactNode } from "react";
import { createAuthClient } from "better-auth/react";
import { Navigate } from "react-router";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Better Auth client — single instance shared across the app.
 * Session state is managed internally via cookies.
 */
export const authClient = createAuthClient({
  baseURL: API_URL || undefined,
});

/**
 * Hook to access the current session.
 * Returns { data: Session | null, isPending, error }.
 */
export function useSession() {
  return authClient.useSession();
}

/**
 * Wrapper that redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session?.user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

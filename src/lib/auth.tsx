import { type ReactNode, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router";
import { authClient } from "./auth-client";

/**
 * Wrapper that redirects unauthenticated users to /login.
 *
 * When the session transitions from unauthenticated → authenticated (e.g. after
 * a deep-link sign-in), we defer rendering the heavy children tree by one frame.
 * This prevents the massive DOM mount from overlapping with DWM / Chromium
 * compositor work from the window-focus transition, which otherwise pegs the
 * GPU at 100% for several seconds on Windows.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const wasAuthed = useRef(false);
  const [deferring, setDeferring] = useState(false);

  const isAuthed = !!session?.user;

  useEffect(() => {
    if (isAuthed && !wasAuthed.current) {
      setDeferring(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDeferring(false));
      });
      return () => cancelAnimationFrame(id);
    }
    wasAuthed.current = isAuthed;
  }, [isAuthed]);

  if (isPending || deferring) return null;
  if (!isAuthed) return <Navigate to="/" replace />;

  return <>{children}</>;
}

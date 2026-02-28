import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { SidebarProvider } from "basics-os/src/components/ui/sidebar";
import { cn } from "basics-os/src/lib/utils";
import { HubSidebar } from "./HubSidebar";

function PageErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6" role="alert">
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

export function HubLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  return (
    <SidebarProvider>
      <HubSidebar />
      <main
        className={cn(
          "flex h-svh flex-col",
          "w-full max-w-full",
          "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
          "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
          "sm:transition-[width] sm:duration-200 sm:ease-linear",
        )}
      >
        <div className="flex-1 overflow-auto">
          <div className="max-w-screen-xl mx-auto pt-4 px-4" id="main-content">
            <ErrorBoundary
              key={location.pathname}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <PageErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
              )}
            >
              {children ?? <Outlet />}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

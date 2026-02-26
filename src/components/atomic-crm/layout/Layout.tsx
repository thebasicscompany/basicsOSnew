import { Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "react-error-boundary";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/admin/user-menu";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { RefreshButton } from "@/components/admin/refresh-button";

import { useConfigurationLoader } from "../root/useConfigurationLoader";
import { CRMSidebar } from "./CRMSidebar";
import { AssistantChatButton } from "../assistant";

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <SidebarProvider>
      <CRMSidebar />
      <main
        className={cn(
          "flex h-svh flex-col",
          "w-full max-w-full",
          "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
          "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
          "sm:transition-[width] sm:duration-200 sm:ease-linear",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--twenty-border-light)] bg-background px-4">
          <SidebarTrigger className="scale-125 sm:scale-100" />
          <div className="flex-1 flex items-center" id="breadcrumb" />
          <ThemeModeToggle />
          <RefreshButton />
          <UserMenu />
        </header>
        <div className="flex-1 overflow-auto">
          <div className="max-w-screen-xl mx-auto pt-4 px-4" id="main-content">
            <ErrorBoundary FallbackComponent={Error}>
              <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <AssistantChatButton />
      <Notification />
    </SidebarProvider>
  );
};

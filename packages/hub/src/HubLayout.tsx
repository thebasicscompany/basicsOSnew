import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { SidebarProvider } from "basics-os/src/components/ui/sidebar";
import { cn } from "basics-os/src/lib/utils";
import { HubSidebar } from "./HubSidebar";

export function HubLayout({ children }: { children?: ReactNode }) {
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
            {children ?? <Outlet />}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

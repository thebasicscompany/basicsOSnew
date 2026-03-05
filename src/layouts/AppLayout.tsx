import { Outlet, useLocation } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  PageHeaderProvider,
  usePageHeaderTitle,
  useRegisterActionsContainer,
  useRegisterBreadcrumbContainer,
  useRegisterTitleSlotContainer,
  useTitleSlotInUse,
} from "@/contexts/page-header";

function PageErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-6"
      role="alert"
    >
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

function LayoutHeader() {
  const title = usePageHeaderTitle();
  const titleSlotInUse = useTitleSlotInUse();
  const registerBreadcrumbContainer = useRegisterBreadcrumbContainer();
  const registerTitleSlotContainer = useRegisterTitleSlotContainer();
  return (
    <header className="drag-region flex h-[52px] shrink-0 items-center gap-3 bg-surface-canvas">
      {/* Traffic light zone (0-76px), 24px gap, then toggle — matches Wispr Flow ratios */}
      <div className="flex items-center pl-[92px]">
        <SidebarTrigger className="size-8 shrink-0" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {titleSlotInUse && (
          <div
            ref={registerTitleSlotContainer}
            className="min-w-0 shrink-0 overflow-hidden [&>*]:truncate"
          />
        )}
        {/* Breadcrumb portal — RecordDetailPage renders here */}
        <div
          ref={registerBreadcrumbContainer}
          className="min-w-0 flex-1 overflow-hidden [&>*]:truncate"
        />
      </div>
    </header>
  );
}

function LayoutContent() {
  const location = useLocation();
  const title = usePageHeaderTitle();
  const registerActionsContainer = useRegisterActionsContainer();
  const isBuilder = /^\/automations\/(create|\d+)/.test(location.pathname);
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        className={
          isBuilder
            ? "flex w-full flex-1 flex-col min-h-0 pl-0 pr-14 pt-4"
            : "flex w-full flex-1 flex-col px-14 pt-4 min-h-0"
        }
        id="main-content"
      >
        {/* Page title + actions bar */}
        <div className="flex shrink-0 items-center gap-2.5 pb-4 empty:hidden">
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
          <div
            ref={registerActionsContainer}
            className="flex flex-1 items-center justify-end gap-2.5 empty:hidden"
          />
        </div>
        <ErrorBoundary
          key={location.pathname}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <PageErrorFallback
              error={error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <PageHeaderProvider>
        <div className="flex h-svh flex-col bg-surface-canvas">
          {/* Full-width header — independent of sidebar state */}
          <LayoutHeader />
          {/* Body row: sidebar + content */}
          <div className="flex flex-1 min-h-0">
            <AppSidebar />
            <SidebarInset className="flex flex-1 min-h-0 flex-col">
              <LayoutContent />
            </SidebarInset>
          </div>
        </div>
      </PageHeaderProvider>
    </SidebarProvider>
  );
}

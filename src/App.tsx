import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { HubLayout, ROUTES } from "@basics-os/hub";
import { AutomationsApp } from "@basics-os/automations";
import { VoiceApp } from "@basics-os/voice";
import { MCPViewerApp } from "@basics-os/mcp-viewer";

import { GatewayProvider } from "@/providers/GatewayProvider";
import { ErrorFallback } from "@/components/error-fallback";
import { ProtectedRoute } from "@/lib/auth";
import { StartPage } from "@/components/auth/start-page";
import { SignupPage } from "@/components/auth/signup-page";
import { ContactsPage } from "@/components/pages/ContactsPage";
import { CompaniesPage } from "@/components/pages/CompaniesPage";
import { DealsPage } from "@/components/pages/DealsPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { SettingsPage } from "@/components/pages/SettingsPage";
import { ImportPage } from "@/components/pages/ImportPage";
import { ChatPage } from "@/components/pages/ChatPage";
import { ConnectionsPage } from "@/components/pages/ConnectionsPage";
import { TasksPage } from "@/components/pages/TasksPage";
import { CommandPalette } from "@/components/command-palette";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

/**
 * Application entry point.
 *
 * Architecture:
 *   - QueryClientProvider: shared TanStack Query client
 *   - BrowserRouter: top-level router
 *   - Public routes: / (StartPage), /sign-up (SignupPage)
 *   - Protected routes: inside HubLayout via ProtectedRoute
 */
function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
      <GatewayProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<StartPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        {/* Protected — all inside HubLayout */}
        <Route
          element={
            <ProtectedRoute>
              <>
                <HubLayout />
                <CommandPalette />
              </>
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.CRM} element={<DashboardPage />} />
          <Route path={ROUTES.CRM_CONTACTS} element={<ContactsPage />} />
          <Route path={ROUTES.CRM_COMPANIES} element={<CompaniesPage />} />
          <Route path={ROUTES.CRM_DEALS} element={<DealsPage />} />
          <Route path={`${ROUTES.AUTOMATIONS}/*`} element={<AutomationsApp />} />
          <Route path={ROUTES.VOICE} element={<VoiceApp />} />
          <Route path={ROUTES.MCP} element={<MCPViewerApp />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.CONNECTIONS} element={<ConnectionsPage />} />
          <Route path={ROUTES.TASKS} element={<TasksPage />} />
          <Route path={ROUTES.IMPORT} element={<ImportPage />} />
          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to={ROUTES.CRM} replace />} />
        </Route>
      </Routes>
      </GatewayProvider>
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

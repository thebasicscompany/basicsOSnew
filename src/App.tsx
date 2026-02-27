import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HubLayout, ROUTES } from "@basics-os/hub";
import { AutomationsApp } from "@basics-os/automations";
import { VoiceApp } from "@basics-os/voice";
import { MCPViewerApp } from "@basics-os/mcp-viewer";

import { GatewayProvider } from "@/providers/GatewayProvider";
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
const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <GatewayProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<StartPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        {/* Protected — all inside HubLayout */}
        <Route
          element={
            <ProtectedRoute>
              <HubLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.CRM} element={<DashboardPage />} />
          <Route path={ROUTES.CRM_CONTACTS} element={<ContactsPage />} />
          <Route path={ROUTES.CRM_COMPANIES} element={<CompaniesPage />} />
          <Route path={ROUTES.CRM_DEALS} element={<DealsPage />} />
          <Route path={ROUTES.AUTOMATIONS} element={<AutomationsApp />} />
          <Route path={ROUTES.VOICE} element={<VoiceApp />} />
          <Route path={ROUTES.MCP} element={<MCPViewerApp />} />
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.IMPORT} element={<ImportPage />} />
          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to={ROUTES.CRM} replace />} />
        </Route>
      </Routes>
      </GatewayProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

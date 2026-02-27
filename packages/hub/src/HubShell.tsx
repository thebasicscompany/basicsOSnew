import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HubLayout } from "./HubLayout";
import { ROUTES } from "./routes";
import { CRMApp } from "@basics-os/crm";
import { AutomationsApp } from "@basics-os/automations";
import { VoiceApp } from "@basics-os/voice";
import { MCPViewerApp } from "@basics-os/mcp-viewer";
import { ProfilePage } from "basics-os/src/components/atomic-crm/settings/ProfilePage";
import { SettingsPage } from "basics-os/src/components/atomic-crm/settings/SettingsPage";
import { ImportPage } from "basics-os/src/components/atomic-crm/misc/ImportPage";

export function HubShell() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HubLayout />}>
          <Route index element={<Navigate to={ROUTES.CRM} replace />} />
          <Route path={`${ROUTES.CRM}/*`} element={<CRMApp />} />
          <Route path={ROUTES.AUTOMATIONS} element={<AutomationsApp />} />
          <Route path={ROUTES.VOICE} element={<VoiceApp />} />
          <Route path={ROUTES.MCP} element={<MCPViewerApp />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.IMPORT} element={<ImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

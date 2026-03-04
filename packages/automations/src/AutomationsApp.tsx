import { useRoutes } from "react-router";
import { AutomationListPage } from "./AutomationListPage";
import { AutomationBuilderPage } from "./AutomationBuilderPage";

export function AutomationsApp() {
  const routes = useRoutes([
    { index: true, element: <AutomationListPage /> },
    { path: "create", element: <AutomationBuilderPage /> },
    { path: ":id", element: <AutomationBuilderPage /> },
  ]);
  return routes;
}

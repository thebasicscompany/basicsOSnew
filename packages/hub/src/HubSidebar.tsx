import { useCallback } from "react";
import { Link, useMatch, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "basics-os/src/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  TaskEdit01Icon,
  CameraMicrophone01Icon,
  PlugIcon,
  Link01Icon,
  UserIcon,
  Settings01Icon,
  FileImportIcon,
  Building02Icon,
  Agreement01Icon,
  Logout01Icon,
  AiChat01Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import { authClient } from "basics-os/src/lib/auth";
import { ROUTES } from "./routes";

const CRM_NAV_ITEMS = [
  { path: ROUTES.CRM_COMPANIES, label: "Companies", icon: Building02Icon },
  { path: ROUTES.CRM_CONTACTS, label: "Contacts", icon: UserIcon },
  { path: ROUTES.CRM_DEALS, label: "Deals", icon: Agreement01Icon },
  { path: ROUTES.TASKS, label: "Tasks", icon: CheckListIcon },
] as const;

const HUB_NAV_ITEMS = [
  { path: ROUTES.CHAT, label: "AI Chat", icon: AiChat01Icon },
  { path: ROUTES.AUTOMATIONS, label: "Automations", icon: TaskEdit01Icon },
  { path: ROUTES.CONNECTIONS, label: "Connections", icon: Link01Icon },
  { path: ROUTES.VOICE, label: "Launch Voice Native", icon: CameraMicrophone01Icon },
  { path: ROUTES.MCP, label: "View Custom MCP", icon: PlugIcon },
] as const;

export function HubSidebar() {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await authClient.signOut();
    navigate("/");
  }, [navigate]);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-[var(--twenty-border-light)] bg-[var(--twenty-sidebar-bg)]"
    >
      <SidebarHeader className="border-b border-[var(--twenty-border-light)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-1 px-1 py-1">
              <Link
                to={ROUTES.CRM}
                className="text-base font-semibold truncate group-data-[state=collapsed]:hidden"
              >
                Basics Hub
              </Link>
              <SidebarTrigger className="ml-auto shrink-0" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <CRMDropdownNavItem />
              {HUB_NAV_ITEMS.map(({ path, label, icon }) => (
                <HubNavItem key={path} to={path} label={label} icon={icon} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[var(--twenty-border-light)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <HubNavItem to={ROUTES.PROFILE} label="Profile" icon={UserIcon} />
              <HubNavItem to={ROUTES.SETTINGS} label="Settings" icon={Settings01Icon} />
              <HubNavItem to={ROUTES.IMPORT} label="Import data" icon={FileImportIcon} />
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Sign out"
                  className="cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-4 shrink-0" />
                  Sign out
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function CRMNavSubItem({
  path,
  label,
  icon,
}: {
  path: string;
  label: string;
  icon: typeof Home01Icon;
}) {
  const match = useMatch({ path, end: path === ROUTES.CRM });
  return (
    <SidebarMenuSubButton asChild size="sm" isActive={!!match}>
      <Link to={path}>
        <HugeiconsIcon icon={icon} className="size-4 shrink-0" />
        {label}
      </Link>
    </SidebarMenuSubButton>
  );
}

/**
 * CRM nav item with sub-items: Dashboard, Companies, Contacts, Deals.
 * Each sub-item navigates to its table.
 */
function CRMDropdownNavItem() {
  const CRM_MATCH = useMatch({ path: ROUTES.CRM, end: true });
  const COMPANIES_MATCH = useMatch({ path: ROUTES.CRM_COMPANIES, end: false });
  const CONTACTS_MATCH = useMatch({ path: ROUTES.CRM_CONTACTS, end: false });
  const DEALS_MATCH = useMatch({ path: ROUTES.CRM_DEALS, end: false });
  const TASKS_MATCH = useMatch({ path: ROUTES.TASKS, end: false });
  const isCrmActive = !!(CRM_MATCH || COMPANIES_MATCH || CONTACTS_MATCH || DEALS_MATCH || TASKS_MATCH);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isCrmActive} tooltip="CRM">
        <Link to={ROUTES.CRM}>
          <HugeiconsIcon icon={Home01Icon} className="size-4 shrink-0" />
          CRM
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {CRM_NAV_ITEMS.map(({ path, label, icon }) => (
          <SidebarMenuSubItem key={path}>
            <CRMNavSubItem path={path} label={label} icon={icon} />
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}

function HubNavItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: typeof Home01Icon;
}) {
  const match = useMatch({ path: to, end: to === ROUTES.CRM });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} tooltip={label}>
        <Link to={to}>
          <HugeiconsIcon icon={icon} className="size-4 shrink-0" />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

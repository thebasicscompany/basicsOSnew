import { useCallback, type ReactNode } from "react";
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
  Logout01Icon,
  AiChat01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { authClient } from "basics-os/src/lib/auth";
import { ROUTES } from "./routes";

const HUB_NAV_ITEMS = [
  { path: ROUTES.CHAT, label: "AI Chat", icon: AiChat01Icon },
  { path: ROUTES.AUTOMATIONS, label: "Automations", icon: TaskEdit01Icon },
  { path: ROUTES.CONNECTIONS, label: "Connections", icon: Link01Icon },
  { path: ROUTES.VOICE, label: "Launch Voice Native", icon: CameraMicrophone01Icon },
  { path: ROUTES.MCP, label: "View Custom MCP", icon: PlugIcon },
] as const;

export function HubSidebar({ extraNavContent }: { extraNavContent?: ReactNode }) {
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search (⌘K)"
                  className="cursor-pointer text-muted-foreground"
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", {
                        key: "k",
                        ctrlKey: true,
                        bubbles: true,
                      })
                    )
                  }
                >
                  <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0" />
                  <span className="flex-1">Search</span>
                  <kbd className="ml-auto hidden text-[10px] tracking-widest text-muted-foreground/60 group-data-[state=expanded]:flex">
                    ⌘K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <HubNavItem to={ROUTES.CRM} label="Dashboard" icon={Home01Icon} />
              {HUB_NAV_ITEMS.map(({ path, label, icon }) => (
                <HubNavItem key={path} to={path} label={label} icon={icon} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dynamic Records section injected from the main app */}
        {extraNavContent}
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

import {
  useCanAccess,
  useHasDashboard,
  useResourceDefinitions,
} from "ra-core";
import { Link, useMatch } from "react-router";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Agreement01Icon,
  Building02Icon,
  FileImportIcon,
  Home01Icon,
  Settings01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { CanAccess } from "ra-core";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { ImportPage } from "../misc/ImportPage";

const CRM_NAV_ITEMS: { path: string; label: string; icon: typeof Home01Icon }[] = [
  { path: "/", label: "Dashboard", icon: Home01Icon },
  { path: "/contacts", label: "Contacts", icon: UserIcon },
  { path: "/companies", label: "Companies", icon: Building02Icon },
  { path: "/deals", label: "Deals", icon: Agreement01Icon },
];

/**
 * Twenty-style sidebar for CRM. Left-aligned navigation with Dashboard, Contacts,
 * Companies, Deals. Collapsible to icon-only. Uses shadcn Sidebar components.
 */
export function CRMSidebar() {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const hasDashboard = useHasDashboard();
  const resources = useResourceDefinitions();
  const { openMobile, setOpenMobile } = useSidebar();

  const handleClick = () => {
    if (openMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-[var(--twenty-border-light)] bg-[var(--twenty-sidebar-bg)]"
    >
      <SidebarHeader className="border-b border-[var(--twenty-border-light)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
              <Link to="/" onClick={handleClick}>
                <img
                  className="[.light_&]:hidden h-6 w-auto"
                  src={darkModeLogo}
                  alt={title}
                />
                <img
                  className="[.dark_&]:hidden h-6 w-auto"
                  src={lightModeLogo}
                  alt={title}
                />
                <span className="text-base font-semibold truncate">{title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {hasDashboard && (
                <NavItem
                  to="/"
                  label="Dashboard"
                  icon={Home01Icon}
                  onClick={handleClick}
                />
              )}
              {CRM_NAV_ITEMS.filter((item) => item.path !== "/").map((item) => (
                <ResourceNavItem
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleClick}
                  resources={resources}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[var(--twenty-border-light)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <CanAccess resource="sales" action="list">
                <NavItem
                  to="/sales"
                  label="Users"
                  icon={UserGroupIcon}
                  onClick={handleClick}
                />
              </CanAccess>
              <NavItem
                to="/profile"
                label="Profile"
                icon={UserIcon}
                onClick={handleClick}
              />
              <CanAccess resource="configuration" action="edit">
<NavItem
                to="/settings"
                label="Settings"
                icon={Settings01Icon}
                  onClick={handleClick}
                />
              </CanAccess>
              <NavItem
                to={ImportPage.path}
                label="Import data"
                icon={FileImportIcon}
                onClick={handleClick}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavItem({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Home01Icon;
  onClick?: () => void;
}) {
  const match = useMatch({ path: to, end: to === "/" });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} tooltip={label}>
        <Link to={to} onClick={onClick}>
          <HugeiconsIcon icon={icon} className="size-4 shrink-0" />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ResourceNavItem({
  path,
  label,
  icon,
  onClick,
  resources,
}: {
  path: string;
  label: string;
  icon: typeof Home01Icon;
  onClick?: () => void;
  resources?: Record<string, { hasList?: boolean }>;
}) {
  const resourceName = path.slice(1).split("/")[0];
  const resource = resources?.[resourceName];
  const { canAccess, isPending } = useCanAccess({
    resource: resourceName,
    action: "list",
  });
  const match = useMatch({ path, end: false });

  if (isPending) return <Skeleton className="h-8 w-full" />;
  if (resource && !resource.hasList) return null;
  if (!canAccess) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} tooltip={label}>
        <Link to={path} state={{ _scrollToTop: true }} onClick={onClick}>
          <HugeiconsIcon icon={icon} className="size-4 shrink-0" />
          {label}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

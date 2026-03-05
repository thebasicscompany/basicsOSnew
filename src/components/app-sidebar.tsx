import { useState, type ComponentProps } from "react";
import { Link, useLocation } from "react-router";
import {
  MagnifyingGlassIcon,
  ChatCircleIcon,
  PlusIcon,
  CaretRightIcon,
  HardDrivesIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { ROUTES } from "@basics-os/hub";
import { NavGroup } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { ObjectRegistryNavSection } from "@/components/ObjectRegistryNavSection";
import { useOrganization } from "@/hooks/use-organization";
import { useThreads } from "@/hooks/use-threads";
import { useMe } from "@/hooks/use-me";
import { SIDEBAR_NAV_APPS } from "@/config/sidebar-nav";
import { Kbd } from "@/components/ui/kbd";
import {
  dispatchCommandPaletteShortcut,
  getCommandPaletteShortcutLabel,
} from "@/lib/keyboard-shortcuts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

function ChatThreadsNav() {
  const { pathname } = useLocation();
  const { data: threads } = useThreads(8);
  const recentThreads = (threads ?? []).filter((t) => t.channel === "chat");
  const hasThreads = recentThreads.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <div className="flex items-center">
          <SidebarGroupLabel asChild className="flex-1">
            <CollapsibleTrigger className="flex w-full items-center">
              Chats
              {hasThreads && (
                <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              )}
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <SidebarGroupAction title="New Chat" asChild>
            <Link to="/chat">
              <PlusIcon className="size-4" />
            </Link>
          </SidebarGroupAction>
        </div>
        {!hasThreads ? (
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/chat"}
                  tooltip="Start new chat"
                >
                  <Link to="/chat">
                    <ChatCircleIcon className="size-4" />
                    <span>Start new chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        ) : (
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentThreads.map((thread) => {
                  const threadPath = `/chat/${thread.id}`;
                  return (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === threadPath}
                        tooltip={thread.title ?? "Untitled"}
                      >
                        <Link to={threadPath}>
                          <ChatCircleIcon className="size-4" />
                          <span className="truncate">
                            {thread.title ?? "Untitled"}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        )}
      </SidebarGroup>
    </Collapsible>
  );
}

function AutomationsNav() {
  const { pathname } = useLocation();
  const isActive =
    pathname === ROUTES.AUTOMATIONS ||
    pathname.startsWith(ROUTES.AUTOMATIONS + "/");

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
        Automations
      </SidebarGroupLabel>
      <SidebarGroupAction title="New automation" asChild>
        <Link to={`${ROUTES.AUTOMATIONS}/create`}>
          <PlusIcon className="size-4" />
        </Link>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip="Hub">
              <Link to={ROUTES.AUTOMATIONS}>
                <HardDrivesIcon className="size-4" />
                <span>Hub</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { data: organization } = useOrganization();
  const { data: me } = useMe();
  const { pathname } = useLocation();
  const shortcutLabel = getCommandPaletteShortcutLabel();
  const isAdmin = Boolean(me?.administrator);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-8 min-w-0 shrink-0 items-center gap-2 overflow-hidden rounded-md px-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
              {organization?.logo?.src ? (
                <img
                  src={organization.logo.src}
                  alt=""
                  className="size-6 shrink-0 rounded object-contain"
                />
              ) : null}
              <span className="truncate font-semibold text-sm group-data-[collapsible=icon]:hidden">
                {organization?.name ?? "Basics Hub"}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`Search (${shortcutLabel})`}
              className="text-muted-foreground"
              onClick={dispatchCommandPaletteShortcut}
            >
              <MagnifyingGlassIcon className="size-4" />
              <span className="flex-1">Search</span>
              <Kbd className="ml-auto text-[10px] tracking-widest group-data-[state=collapsed]:hidden">
                {shortcutLabel}
              </Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup {...SIDEBAR_NAV_APPS} />
        <ChatThreadsNav />
        <ObjectRegistryNavSection />
        <AutomationsNav />
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(ROUTES.ADMIN_USAGE)}
                    tooltip="AI Usage"
                  >
                    <Link to={ROUTES.ADMIN_USAGE}>
                      <ChartBarIcon className="size-4" />
                      <span>AI Usage</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

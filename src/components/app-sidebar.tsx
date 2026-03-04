import type { ComponentProps } from "react"
import { LayoutIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { NavGroup } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ObjectRegistryNavSection } from "@/components/ObjectRegistryNavSection"
import { SIDEBAR_NAV_APPS, SIDEBAR_NAV_AUTOMATIONS } from "@/config/sidebar-nav"
import { Kbd } from "@/components/ui/kbd"
import {
  dispatchCommandPaletteShortcut,
  getCommandPaletteShortcutLabel,
} from "@/lib/keyboard-shortcuts"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const WORKSPACES = [
  { name: "Basics Hub", logo: LayoutIcon, plan: "Desktop" },
]

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const shortcutLabel = getCommandPaletteShortcutLabel()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={WORKSPACES} />
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
        <ObjectRegistryNavSection />
        <NavGroup {...SIDEBAR_NAV_AUTOMATIONS} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

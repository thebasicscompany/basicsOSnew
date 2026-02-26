import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Home01Icon, Logout01Icon, Settings01Icon, SmartPhone01Icon, Sun01Icon, TaskEdit01Icon, UserGroupIcon, UserIcon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/components/admin/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CanAccess, Translate, useAuthProvider, useGetIdentity, useLogout } from "ra-core";
import { Link, matchPath, useLocation, useMatch } from "react-router";
import { ContactCreateSheet } from "../contacts/ContactCreateSheet";
import { useState } from "react";
import { NoteCreateSheet } from "../notes/NoteCreateSheet";
import { TaskCreateSheet } from "../tasks/TaskCreateSheet";

export const MobileNavigation = () => {
  const location = useLocation();

  let currentPath: string | boolean = "/";
  if (matchPath("/", location.pathname)) {
    currentPath = "/";
  } else if (matchPath("/contacts/*", location.pathname)) {
    currentPath = "/contacts";
  } else if (matchPath("/companies/*", location.pathname)) {
    currentPath = "/companies";
  } else if (matchPath("/tasks/*", location.pathname)) {
    currentPath = "/tasks";
  } else if (matchPath("/deals/*", location.pathname)) {
    currentPath = "/deals";
  } else {
    currentPath = false;
  }

  // Check if the app is running as a PWA (standalone mode)
  const isPwa = window.matchMedia("(display-mode: standalone)").matches;
  // Check if it's iOS on the web
  const isWebiOS = /iPad|iPod|iPhone/.test(window.navigator.userAgent);

  return (
    <nav
      aria-label="CRM navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-secondary h-14"
      style={{
        // iOS bug: even though viewport is set correctly, the bottom safe area inset is not accounted for
        // So we manually add some padding to avoid the navigation being too close to the home bar
        paddingBottom: isPwa && isWebiOS ? 15 : undefined,
        // We use box-sizing: border-box, so the height contains the padding.
        // To actually increase the height, we need to account for the extra padding on iOS PWA
        height: isPwa && isWebiOS ? "calc(3.5rem + 15px)" : undefined,
      }}
    >
      <div className="flex justify-center">
        <>
          <NavigationButton
            href="/"
            icon={Home01Icon}
            label="Home"
            isActive={currentPath === "/"}
          />
          <NavigationButton
            href="/contacts"
            icon={UserGroupIcon}
            label="Contacts"
            isActive={currentPath === "/contacts"}
          />
          <CreateButton />
          <NavigationButton
            href="/tasks"
            icon={TaskEdit01Icon}
            label="Tasks"
            isActive={currentPath === "/tasks"}
          />
          <SettingsButton />
        </>
      </div>
    </nav>
  );
};

const NavigationButton = ({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: typeof Home01Icon;
  label: string;
  isActive: boolean;
}) => (
  <Button
    asChild
    variant="ghost"
    className={cn(
      "flex-col gap-1 h-auto py-2 px-1 rounded-md w-16",
      isActive ? null : "text-muted-foreground",
    )}
  >
    <Link to={href}>
      <HugeiconsIcon icon={icon} className="size-6" />
      <span className="text-[0.6rem] font-medium">{label}</span>
    </Link>
  </Button>
);

const CreateButton = () => {
  const contact_id = useMatch("/contacts/:id/*")?.params.id;
  const [contactCreateOpen, setContactCreateOpen] = useState(false);
  const [noteCreateOpen, setNoteCreateOpen] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);

  return (
    <>
      <ContactCreateSheet
        open={contactCreateOpen}
        onOpenChange={setContactCreateOpen}
      />
      <NoteCreateSheet
        open={noteCreateOpen}
        onOpenChange={setNoteCreateOpen}
        contact_id={contact_id}
      />
      <TaskCreateSheet
        open={taskCreateOpen}
        onOpenChange={setTaskCreateOpen}
        contact_id={contact_id}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="h-16 w-16 rounded-full -mt-3"
            aria-label="Create"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-10" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="h-12 px-4 text-base"
            onSelect={() => {
              setContactCreateOpen(true);
            }}
          >
            Contact
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-12 px-4 text-base"
            onSelect={() => {
              setNoteCreateOpen(true);
            }}
          >
            Note
          </DropdownMenuItem>
          <DropdownMenuItem
            className="h-12 px-4 text-base"
            onSelect={() => {
              setTaskCreateOpen(true);
            }}
          >
            Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const SettingsButton = () => {
  const authProvider = useAuthProvider();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();
  if (!authProvider) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex-col gap-1 h-auto py-2 px-1 rounded-md w-16 text-muted-foreground"
        >
          <HugeiconsIcon icon={Settings01Icon} className="size-6" />
          <span className="text-[0.6rem] font-medium">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="font-normal h-12 px-4">
          <div className="flex flex-col justify-center h-full">
            <p className="text-base font-medium leading-none">
              {identity?.fullName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="h-12 px-4 text-base cursor-pointer">
          <Link to="/profile" className="flex items-center">
            <HugeiconsIcon icon={UserIcon} className="mr-2 size-5" />
            Profile
          </Link>
        </DropdownMenuItem>
        <CanAccess resource="configuration" action="edit">
          <DropdownMenuItem asChild className="h-12 px-4 text-base cursor-pointer">
            <Link to="/settings" className="flex items-center">
              <HugeiconsIcon icon={Settings01Icon} className="mr-2 size-5" />
              Settings
            </Link>
          </DropdownMenuItem>
        </CanAccess>
        <DropdownMenuSeparator />
        <ThemeMenu />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer h-12 px-4 text-base"
        >
          <HugeiconsIcon icon={Logout01Icon} />
          <Translate i18nKey="ra.auth.logout">Log out</Translate>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ThemeMenu = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="px-3 py-2">
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) =>
          value && setTheme(value as "light" | "dark" | "system")
        }
        className="justify-start"
        size="lg"
        variant="outline"
      >
        <ToggleGroupItem
          value="system"
          aria-label="System theme"
          className="px-3"
        >
          <HugeiconsIcon icon={SmartPhone01Icon} className="size-5 mx-2" />
          <span className="sr-only">System</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="light"
          aria-label="Light theme"
          className="px-3"
        >
          <HugeiconsIcon icon={Sun01Icon} className="size-5 mx-2" />
          <span className="sr-only">Light</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Dark theme" className="px-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5 mx-2 shrink-0 block"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span className="sr-only">Dark</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

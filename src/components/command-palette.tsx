import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserIcon,
  Building02Icon,
  Agreement01Icon,
  CheckListIcon,
  Settings01Icon,
  FileImportIcon,
  AiChat01Icon,
  Link01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { ROUTES } from "@basics-os/hub";

const COMMAND_PALETTE_KEY = "k";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === COMMAND_PALETTE_KEY && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Navigate or create records. Type to filter."
    >
      <CommandInput placeholder="Search or run a command..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CRM))}
            className="gap-2"
          >
            <HugeiconsIcon icon={Home01Icon} className="size-4 shrink-0" />
            Dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CRM_CONTACTS))}
            className="gap-2"
          >
            <HugeiconsIcon icon={UserIcon} className="size-4 shrink-0" />
            Contacts
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CRM_COMPANIES))}
            className="gap-2"
          >
            <HugeiconsIcon icon={Building02Icon} className="size-4 shrink-0" />
            Companies
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CRM_DEALS))}
            className="gap-2"
          >
            <HugeiconsIcon icon={Agreement01Icon} className="size-4 shrink-0" />
            Deals
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.TASKS))}
            className="gap-2"
          >
            <HugeiconsIcon icon={CheckListIcon} className="size-4 shrink-0" />
            Tasks
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Create new">
          <CommandItem
            onSelect={() =>
              run(() => navigate(`${ROUTES.CRM_CONTACTS}?open=new`))
            }
            className="gap-2"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4 shrink-0" />
            New Contact
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => navigate(`${ROUTES.CRM_COMPANIES}?open=new`))
            }
            className="gap-2"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4 shrink-0" />
            New Company
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => navigate(`${ROUTES.CRM_DEALS}?open=new`))
            }
            className="gap-2"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4 shrink-0" />
            New Deal
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Other">
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CHAT))}
            className="gap-2"
          >
            <HugeiconsIcon icon={AiChat01Icon} className="size-4 shrink-0" />
            AI Chat
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.CONNECTIONS))}
            className="gap-2"
          >
            <HugeiconsIcon icon={Link01Icon} className="size-4 shrink-0" />
            Connections
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.PROFILE))}
            className="gap-2"
          >
            <HugeiconsIcon icon={UserIcon} className="size-4 shrink-0" />
            Profile
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.SETTINGS))}
            className="gap-2"
          >
            <HugeiconsIcon icon={Settings01Icon} className="size-4 shrink-0" />
            Settings
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.IMPORT))}
            className="gap-2"
          >
            <HugeiconsIcon icon={FileImportIcon} className="size-4 shrink-0" />
            Import data
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup>
          <CommandItem className="text-muted-foreground" disabled>
            <CommandShortcut>⌘K</CommandShortcut>
            Open palette
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

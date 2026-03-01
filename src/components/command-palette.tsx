import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
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
import { getList } from "@/lib/api/crm";
import type { ContactSummary } from "@/hooks/use-contacts";
import type { CompanySummary } from "@/hooks/use-companies";
import type { Deal } from "@/hooks/use-deals";
import { DealStageBadge } from "@/components/status-badge";

const COMMAND_PALETTE_KEY = "k";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const isSearching = search.length >= 2;

  // Reset search when palette closes
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

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

  const { data: contactsData } = useQuery({
    queryKey: ["search:contacts", search],
    queryFn: () =>
      getList<ContactSummary>("contacts_summary", {
        filter: { q: search },
        pagination: { page: 1, perPage: 5 },
      }),
    enabled: isSearching,
    staleTime: 10_000,
  });

  const { data: companiesData } = useQuery({
    queryKey: ["search:companies", search],
    queryFn: () =>
      getList<CompanySummary>("companies_summary", {
        filter: { q: search },
        pagination: { page: 1, perPage: 5 },
      }),
    enabled: isSearching,
    staleTime: 10_000,
  });

  const { data: dealsData } = useQuery({
    queryKey: ["search:deals", search],
    queryFn: () =>
      getList<Deal>("deals", {
        filter: { q: search },
        pagination: { page: 1, perPage: 5 },
      }),
    enabled: isSearching,
    staleTime: 10_000,
  });

  const contacts = contactsData?.data ?? [];
  const companies = companiesData?.data ?? [];
  const deals = dealsData?.data ?? [];
  const hasResults = contacts.length > 0 || companies.length > 0 || deals.length > 0;

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog
      shouldFilter={false}
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search contacts, companies, and deals. Navigate or create records."
    >
      <CommandInput
        placeholder="Search or run a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {isSearching ? (
          <>
            {!hasResults && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{search}&rdquo;
              </p>
            )}
            {contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {contacts.map((c) => {
                  const displayName =
                    [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                    c.email ||
                    "Unnamed";
                  return (
                    <CommandItem
                      key={c.id}
                      value={`contact-${c.id}-${displayName}-${c.companyName ?? ""}`}
                      onSelect={() =>
                        run(() => navigate(`/contacts/${c.id}`))
                      }
                      className="gap-2"
                    >
                      <HugeiconsIcon icon={UserIcon} className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{displayName}</span>
                      {c.companyName && (
                        <span className="text-xs text-muted-foreground">
                          {c.companyName}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {companies.length > 0 && (
              <>
                {contacts.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Companies">
                  {companies.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`company-${c.id}-${c.name}`}
                      onSelect={() =>
                        run(() => navigate(`/companies/${c.id}`))
                      }
                      className="gap-2"
                    >
                      <HugeiconsIcon
                        icon={Building02Icon}
                        className="size-4 shrink-0"
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      {c.sector && (
                        <span className="text-xs text-muted-foreground">
                          {c.sector}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {deals.length > 0 && (
              <>
                {(contacts.length > 0 || companies.length > 0) && (
                  <CommandSeparator />
                )}
                <CommandGroup heading="Deals">
                  {deals.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={`deal-${d.id}-${d.name}`}
                      onSelect={() =>
                        run(() => navigate(`/deals/${d.id}`))
                      }
                      className="gap-2"
                    >
                      <HugeiconsIcon
                        icon={Agreement01Icon}
                        className="size-4 shrink-0"
                      />
                      <span className="flex-1 truncate">{d.name}</span>
                      <DealStageBadge stage={d.stage} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        ) : (
          <>
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
                <HugeiconsIcon
                  icon={Building02Icon}
                  className="size-4 shrink-0"
                />
                Companies
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => navigate(ROUTES.CRM_DEALS))}
                className="gap-2"
              >
                <HugeiconsIcon
                  icon={Agreement01Icon}
                  className="size-4 shrink-0"
                />
                Deals
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => navigate(ROUTES.TASKS))}
                className="gap-2"
              >
                <HugeiconsIcon
                  icon={CheckListIcon}
                  className="size-4 shrink-0"
                />
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
                <HugeiconsIcon
                  icon={AiChat01Icon}
                  className="size-4 shrink-0"
                />
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
                <HugeiconsIcon
                  icon={Settings01Icon}
                  className="size-4 shrink-0"
                />
                Settings
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => navigate(ROUTES.IMPORT))}
                className="gap-2"
              >
                <HugeiconsIcon
                  icon={FileImportIcon}
                  className="size-4 shrink-0"
                />
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

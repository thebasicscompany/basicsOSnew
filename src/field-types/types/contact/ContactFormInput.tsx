import { UserIcon, CheckIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FormInputProps } from "@/field-types/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { getList, getOne } from "@/lib/api/crm";
import { mapRecords, snakeToCamel } from "@/lib/crm/field-mapper";
import { cn } from "@/lib/utils";

interface ContactOption {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function contactDisplayName(c: ContactOption): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return full || c.email || String(c.id);
}

export function ContactFormInput({ value, onChange, error }: FormInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["contacts", "list", search],
    queryFn: async () => {
      const result = await getList<Record<string, unknown>>("contacts", {
        filter: search.trim() ? { q: search.trim() } : {},
        pagination: { page: 1, perPage: 50 },
      });
      const rows = mapRecords(result.data) as ContactOption[];
      return { data: rows, total: result.total };
    },
    enabled: open,
    staleTime: 30_000,
  });

  const contactId = value != null ? Number(value) : null;
  const { data: selectedContact } = useQuery({
    queryKey: ["contacts", contactId],
    queryFn: async () => {
      const row = await getOne<Record<string, unknown>>("contacts", contactId!);
      return snakeToCamel(row) as ContactOption;
    },
    enabled: contactId != null && contactId > 0,
    staleTime: 60_000,
  });

  const contacts = useMemo(() => data?.data ?? [], [data?.data]);
  const selectedInList = useMemo(
    () =>
      value != null ? contacts.find((c) => c.id === Number(value)) : null,
    [contacts, value],
  );

  const displayLabel = selectedInList
    ? contactDisplayName(selectedInList)
    : selectedContact
      ? contactDisplayName(selectedContact)
      : value != null
        ? String(value)
        : null;

  return (
    <div className="flex flex-col gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input bg-background flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-1 text-sm shadow-xs",
              error && "border-destructive",
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              {displayLabel ? (
                <>
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{displayLabel}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Search contacts...</span>
              )}
            </span>
            <CaretDownIcon className="text-muted-foreground size-4 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name, email..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isPending ? "Loading..." : "No contacts found."}
              </CommandEmpty>
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">No contact</span>
              </CommandItem>
              {contacts.map((contact) => {
                const isSelected = value === contact.id;
                const name = contactDisplayName(contact);
                return (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.id}-${name}`}
                    onSelect={() => {
                      onChange(contact.id);
                      setOpen(false);
                    }}
                  >
                    <UserIcon className="text-muted-foreground mr-2 size-4 shrink-0" />
                    <span className="flex-1 truncate">{name}</span>
                    {isSelected && (
                      <CheckIcon className="text-primary ml-auto size-4 shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

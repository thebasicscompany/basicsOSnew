import { UserIcon, CheckIcon } from "@phosphor-icons/react";
import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CellEditorProps } from "@/field-types/types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { getList, getOne } from "@/lib/api/crm";
import { mapRecords, snakeToCamel } from "@/lib/crm/field-mapper";

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

export function ContactCellEditor({
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const didCommitRef = useRef(false);

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
    staleTime: 30_000,
  });

  const contactId = value != null ? Number(value) : null;
  const { data: _selectedContact } = useQuery({
    queryKey: ["contacts", contactId],
    queryFn: async () => {
      const row = await getOne<Record<string, unknown>>("contacts", contactId!);
      return snakeToCamel(row) as ContactOption;
    },
    enabled: contactId != null && contactId > 0,
    staleTime: 60_000,
  });

  const contacts = useMemo(() => data?.data ?? [], [data?.data]);

  const handleSelect = (id: number | null) => {
    didCommitRef.current = true;
    onSave(id);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o && !didCommitRef.current) onCancel();
        if (!o) didCommitRef.current = false;
        setOpen(o);
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-56 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                onCancel();
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]"
          >
            <span className="text-muted-foreground">No contact</span>
          </button>
          {isPending && contacts.length === 0 ? (
            <div className="px-2 py-4 text-center text-[13px] text-muted-foreground">
              Loading...
            </div>
          ) : contacts.length === 0 ? (
            <div className="px-2 py-4 text-center text-[13px] text-muted-foreground">
              No contacts found.
            </div>
          ) : (
            contacts.map((contact) => {
              const isSelected = contactId === contact.id;
              const name = contactDisplayName(contact);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelect(contact.id)}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]"
                >
                  <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{name}</span>
                  {isSelected && (
                    <CheckIcon className="text-primary ml-auto size-4 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

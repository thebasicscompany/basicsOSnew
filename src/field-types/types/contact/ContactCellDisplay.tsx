import { useQuery } from "@tanstack/react-query";
import { UserIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "@/field-types/types";
import { getOne } from "@/lib/api/crm";
import { snakeToCamel } from "@/lib/crm/field-mapper";

interface ContactRecord {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function contactDisplayName(c: ContactRecord): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return full || c.email || String(c.id);
}

export function ContactCellDisplay({ value }: CellDisplayProps) {
  const contactId = value != null && value !== "" ? Number(value) : null;

  const { data: contact } = useQuery({
    queryKey: ["contacts", contactId],
    queryFn: async () => {
      const row = await getOne<Record<string, unknown>>("contacts", contactId!);
      return snakeToCamel(row) as ContactRecord;
    },
    enabled: contactId != null && contactId > 0,
    staleTime: 60_000,
  });

  if (contactId == null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <span className="flex w-full items-center gap-1.5 truncate text-sm">
      <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
      {contact ? contactDisplayName(contact) : "…"}
    </span>
  );
}

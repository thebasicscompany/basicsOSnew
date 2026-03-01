import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useContacts, useDeleteContact, type ContactSummary } from "@/hooks/use-contacts";
import { ContactStatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { ContactSheet } from "@/components/sheets/ContactSheet";
import { ManageColumnsDialog } from "@/components/manage-columns-dialog";
import { useCustomColumns } from "@/hooks/use-custom-columns";
import { cn } from "@/lib/utils";

const BASE_COLUMNS: ColumnDef<ContactSummary>[] = [
  {
    id: "avatar",
    header: () => null,
    cell: ({ row }) => {
      const c = row.original;
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "?";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      if (c.avatar?.src) {
        return (
          <img
            src={c.avatar.src}
            alt={name}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        );
      }
      return (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
          )}
        >
          {initials || "?"}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    meta: { title: "First Name" },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    meta: { title: "Last Name" },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: { title: "Email" },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    meta: { title: "Company" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { title: "Status" },
    cell: ({ getValue }) => (
      <ContactStatusBadge status={getValue<string | null>()} />
    ),
  },
  {
    accessorKey: "nbTasks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tasks" />
    ),
    meta: { title: "Tasks" },
  },
];

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ContactSummary | null>(null);

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId = openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useContacts({
    pagination: { page: 1, perPage: 100 },
  });
  const deleteContact = useDeleteContact();

  useEffect(() => {
    if (openNew) {
      setSelected(null);
      setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [openNew, setSearchParams]);

  useEffect(() => {
    if (openId && data?.data) {
      const found = data.data.find((c) => c.id === openId);
      if (found) {
        setSelected(found);
        setSheetOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [openId, data?.data, setSearchParams]);
  const customColumns = useCustomColumns<ContactSummary>("contacts");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: ContactSummary) => {
    navigate(`/contacts/${row.id}`);
  };

  const handleNew = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load contacts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data ? `${data.total} total` : ""}
          </span>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      {!isPending && (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-16 text-center">
          <Users className="size-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No contacts yet</p>
            <p className="text-sm text-muted-foreground">Add your first contact to get started.</p>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isPending}
          onRowClick={handleRowClick}
          toolbar={<ManageColumnsDialog resource="contacts" />}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              await deleteContact.mutateAsync(id);
            }
          }}
        />
      )}

      <ContactSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
        contact={selected}
      />
    </div>
  );
}

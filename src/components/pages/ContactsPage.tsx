import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useContacts, type ContactSummary } from "@/hooks/use-contacts";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { ContactSheet } from "@/components/sheets/ContactSheet";
import { ManageColumnsDialog } from "@/components/manage-columns-dialog";
import { useCustomColumns } from "@/hooks/use-custom-columns";

const BASE_COLUMNS: ColumnDef<ContactSummary>[] = [
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ContactSummary | null>(null);

  const { data, isPending, isError } = useContacts({
    pagination: { page: 1, perPage: 100 },
  });
  const customColumns = useCustomColumns<ContactSummary>("contacts");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: ContactSummary) => {
    setSelected(row);
    setSheetOpen(true);
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

      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={handleRowClick}
        toolbar={<ManageColumnsDialog resource="contacts" />}
      />

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={selected}
      />
    </div>
  );
}

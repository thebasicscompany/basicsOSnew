import { useNavigate } from "react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useContacts, type ContactSummary } from "@/hooks/use-contacts";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";

const columns: ColumnDef<ContactSummary>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
    meta: { title: "First Name" },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
    meta: { title: "Last Name" },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    meta: { title: "Email" },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    meta: { title: "Company" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: "Status" },
  },
  {
    accessorKey: "nbTasks",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tasks" />,
    meta: { title: "Tasks" },
  },
];

export function ContactsPage() {
  const navigate = useNavigate();
  const { data, isPending, isError } = useContacts({ pagination: { page: 1, perPage: 100 } });

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
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total} total` : ""}
        </span>
      </div>
      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={(row) => navigate(`/contacts/${row.id}/show`)}
      />
    </div>
  );
}

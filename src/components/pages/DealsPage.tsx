import { useNavigate } from "react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useDeals, type Deal } from "@/hooks/use-deals";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const columns: ColumnDef<Deal>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { title: "Name" },
  },
  {
    accessorKey: "stage",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
    meta: { title: "Stage" },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    meta: { title: "Category" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    meta: { title: "Amount" },
    cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
  },
  {
    accessorKey: "expectedClosingDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Closing Date" />,
    meta: { title: "Closing Date" },
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? new Date(val).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    meta: { title: "Created" },
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];

export function DealsPage() {
  const navigate = useNavigate();
  const { data, isPending, isError } = useDeals({ pagination: { page: 1, perPage: 100 } });

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load deals.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total} total` : ""}
        </span>
      </div>
      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={(row) => navigate(`/deals/${row.id}/show`)}
      />
    </div>
  );
}

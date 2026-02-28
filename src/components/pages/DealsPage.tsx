import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDeals, type Deal } from "@/hooks/use-deals";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { DealSheet } from "@/components/sheets/DealSheet";
import { ManageColumnsDialog } from "@/components/manage-columns-dialog";
import { useCustomColumns } from "@/hooks/use-custom-columns";

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const BASE_COLUMNS: ColumnDef<Deal>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { title: "Name" },
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    meta: { title: "Stage" },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    meta: { title: "Category" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    meta: { title: "Amount" },
    cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
  },
  {
    accessorKey: "expectedClosingDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Closing Date" />
    ),
    meta: { title: "Closing Date" },
    cell: ({ getValue }) => {
      const val = getValue<string | null>();
      return val ? new Date(val).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    meta: { title: "Created" },
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];

export function DealsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Deal | null>(null);

  const { data, isPending, isError } = useDeals({
    pagination: { page: 1, perPage: 100 },
  });
  const customColumns = useCustomColumns<Deal>("deals");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: Deal) => {
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
        Failed to load deals.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data ? `${data.total} total` : ""}
          </span>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={handleRowClick}
        toolbar={<ManageColumnsDialog resource="deals" />}
      />

      <DealSheet open={sheetOpen} onOpenChange={setSheetOpen} deal={selected} />
    </div>
  );
}

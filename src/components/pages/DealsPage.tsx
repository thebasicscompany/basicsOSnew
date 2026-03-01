import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { LayoutList, LayoutGrid, Plus, Handshake } from "lucide-react";
import { useDeals, type Deal } from "@/hooks/use-deals";
import { DealStageBadge } from "@/components/status-badge";
import { DealsKanban } from "@/components/deals-kanban";
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
    cell: ({ getValue }) => (
      <DealStageBadge stage={getValue<string | null>()} />
    ),
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [view, setView] = useState<"table" | "board">("table");

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId = openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useDeals({
    pagination: { page: 1, perPage: 100 },
  });

  useEffect(() => {
    if (openNew) {
      setSelected(null);
      setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [openNew, setSearchParams]);

  useEffect(() => {
    if (openId && data?.data) {
      const found = data.data.find((d) => d.id === openId);
      if (found) {
        setSelected(found);
        setSheetOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [openId, data?.data, setSearchParams]);
  const customColumns = useCustomColumns<Deal>("deals");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: Deal) => {
    navigate(`/deals/${row.id}`);
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
          <div className="flex rounded-md border">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none border-0 px-2.5"
              onClick={() => setView("table")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none border-0 border-l px-2.5"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {!isPending && (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-16 text-center">
          <Handshake className="size-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No deals yet</p>
            <p className="text-sm text-muted-foreground">Track your pipeline by adding your first deal.</p>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      ) : view === "board" ? (
        <DealsKanban
          deals={data?.data ?? []}
          onDealClick={handleRowClick}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isPending}
          onRowClick={handleRowClick}
          toolbar={<ManageColumnsDialog resource="deals" />}
        />
      )}

      <DealSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
        deal={selected}
      />
    </div>
  );
}

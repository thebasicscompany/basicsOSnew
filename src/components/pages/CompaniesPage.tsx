import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCompanies, type CompanySummary } from "@/hooks/use-companies";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { CompanySheet } from "@/components/sheets/CompanySheet";
import { ManageColumnsDialog } from "@/components/manage-columns-dialog";
import { useCustomColumns } from "@/hooks/use-custom-columns";

const BASE_COLUMNS: ColumnDef<CompanySummary>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { title: "Name" },
  },
  {
    accessorKey: "sector",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sector" />
    ),
    meta: { title: "Sector" },
  },
  {
    accessorKey: "website",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Website" />
    ),
    meta: { title: "Website" },
    cell: ({ getValue }) => {
      const url = getValue<string | null>();
      return url ? (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      ) : null;
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
    meta: { title: "City" },
  },
  {
    accessorKey: "nbContacts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contacts" />
    ),
    meta: { title: "Contacts" },
  },
  {
    accessorKey: "nbDeals",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deals" />
    ),
    meta: { title: "Deals" },
  },
];

export function CompaniesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<CompanySummary | null>(null);

  const { data, isPending, isError } = useCompanies({
    pagination: { page: 1, perPage: 100 },
  });
  const customColumns = useCustomColumns<CompanySummary>("companies");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: CompanySummary) => {
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
        Failed to load companies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data ? `${data.total} total` : ""}
          </span>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Company
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={handleRowClick}
        toolbar={<ManageColumnsDialog resource="companies" />}
      />

      <CompanySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        company={selected}
      />
    </div>
  );
}

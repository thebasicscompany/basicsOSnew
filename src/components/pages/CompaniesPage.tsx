import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { useCompanies, type CompanySummary } from "@/hooks/use-companies";
import { SectorBadge } from "@/components/status-badge";
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
    cell: ({ getValue }) => (
      <SectorBadge sector={getValue<string | null>()} />
    ),
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<CompanySummary | null>(null);

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId = openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useCompanies({
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
      const found = data.data.find((c) => c.id === openId);
      if (found) {
        setSelected(found);
        setSheetOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [openId, data?.data, setSearchParams]);
  const customColumns = useCustomColumns<CompanySummary>("companies");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: CompanySummary) => {
    navigate(`/companies/${row.id}`);
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

      {!isPending && (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-16 text-center">
          <Building2 className="size-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No companies yet</p>
            <p className="text-sm text-muted-foreground">Add your first company to get started.</p>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Company
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isPending}
          onRowClick={handleRowClick}
          toolbar={<ManageColumnsDialog resource="companies" />}
        />
      )}

      <CompanySheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
        company={selected}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import {
  useCompanies,
  useDeleteCompany,
  useUpdateCompany,
  type CompanySummary,
} from "@/hooks/use-companies";
import { CompanySheet } from "@/components/sheets/CompanySheet";
import { SpreadsheetGrid } from "@/components/spreadsheet";
import { ExpandedRowModal } from "@/components/spreadsheet/ExpandedRowModal";

type Row = Record<string, unknown> & { id?: number | string };

export function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<Row | null>(null);

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId =
    openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useCompanies({
    pagination: { page: 1, perPage: 500 },
  });
  const deleteCompany = useDeleteCompany();
  const updateCompany = useUpdateCompany();

  const handleCellUpdate = useCallback(
    (rowId: number | string, field: string, value: unknown) => {
      updateCompany.mutate({
        id: Number(rowId),
        data: { [field]: value } as Partial<CompanySummary>,
      });
    },
    [updateCompany],
  );

  useEffect(() => {
    if (openNew) {
      setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [openNew, setSearchParams]);

  useEffect(() => {
    if (openId && data?.data) {
      const found = data.data.find((c) => c.id === openId);
      if (found) {
        setExpandedRow(found as unknown as Row);
        setSearchParams({}, { replace: true });
      }
    }
  }, [openId, data?.data, setSearchParams]);

  const handleNew = () => {
    setSheetOpen(true);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load companies.
      </div>
    );
  }

  const rows = (data?.data ?? []) as Row[];

  if (!isPending && rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Building2 className="size-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No companies yet</p>
          <p className="text-[12px] text-muted-foreground">
            Add your first company to get started.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          className="h-7 gap-1 text-[13px]"
        >
          <Plus className="size-3.5" />
          New Company
        </Button>
        <CompanySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          company={null}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SpreadsheetGrid
        resource="companies_summary"
        data={rows}
        total={data?.total}
        isLoading={isPending}
        onCellUpdate={handleCellUpdate}
        readOnlyColumns={["nbContacts", "nbDeals"]}
        hiddenColumns={["salesId"]}
        onRowExpand={(row) => setExpandedRow(row)}
        onNewRow={handleNew}
        onBulkDelete={async (ids) => {
          for (const id of ids) await deleteCompany.mutateAsync(id);
        }}
      />

      <ExpandedRowModal
        open={!!expandedRow}
        onOpenChange={(open) => {
          if (!open) setExpandedRow(null);
        }}
        resource="companies_summary"
        row={expandedRow}
        title={(expandedRow?.name as string) ?? "Untitled"}
        onFieldUpdate={handleCellUpdate}
        onDelete={(id) => {
          deleteCompany.mutate(id);
          setExpandedRow(null);
        }}
        readOnlyColumns={["nbContacts", "nbDeals"]}
        allRows={rows}
        onNavigateRow={(row) => setExpandedRow(row)}
      />

      <CompanySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        company={null}
      />
    </div>
  );
}

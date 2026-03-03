import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { LayoutList, LayoutGrid, Plus, Handshake } from "lucide-react";
import {
  useDeals,
  useDeleteDeal,
  useUpdateDeal,
  type Deal,
} from "@/hooks/use-deals";
import {
  useDealNotes,
  useCreateDealNote,
  useDeleteDealNote,
} from "@/hooks/use-deal-notes";
import { DealsKanban } from "@/components/deals-kanban";
import { DealSheet } from "@/components/sheets/DealSheet";
import { SpreadsheetGrid } from "@/components/spreadsheet";
import {
  ExpandedRowModal,
  type ExpandedRowTab,
} from "@/components/spreadsheet/ExpandedRowModal";
import { NotesFeed } from "@/components/notes-feed";
import { usePageTitle } from "@/contexts/page-header";

type Row = Record<string, unknown> & { id?: number | string };

export function DealsPage() {
  usePageTitle("Deals");
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<"table" | "board">("table");
  const [expandedRow, setExpandedRow] = useState<Row | null>(null);

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId =
    openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useDeals({
    pagination: { page: 1, perPage: 500 },
  });
  const deleteDeal = useDeleteDeal();
  const updateDeal = useUpdateDeal();

  const expandedId = expandedRow?.id ? Number(expandedRow.id) : null;
  const { data: notesData } = useDealNotes(expandedId);
  const createNote = useCreateDealNote();
  const deleteNote = useDeleteDealNote();

  const handleCellUpdate = useCallback(
    (rowId: number | string, field: string, value: unknown) => {
      updateDeal.mutate({
        id: Number(rowId),
        data: { [field]: value } as Partial<Deal>,
      });
    },
    [updateDeal],
  );

  useEffect(() => {
    if (openNew) {
      setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [openNew, setSearchParams]);

  useEffect(() => {
    if (openId && data?.data) {
      const found = data.data.find((d) => d.id === openId);
      if (found) {
        setExpandedRow(found as unknown as Row);
        setSearchParams({}, { replace: true });
      }
    }
  }, [openId, data?.data, setSearchParams]);

  const handleDealClick = (deal: Deal) => {
    setExpandedRow(deal as unknown as Row);
  };

  const handleNew = () => {
    setSheetOpen(true);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load deals.
      </div>
    );
  }

  const rows = (data?.data ?? []) as Row[];

  const notesTabs: ExpandedRowTab[] = expandedId
    ? [
        {
          value: "notes",
          label: "Notes",
          content: (
            <NotesFeed
              notes={notesData?.data ?? []}
              isLoading={!notesData}
              onAdd={async (text) => {
                if (expandedId)
                  await createNote.mutateAsync({ dealId: expandedId, text });
              }}
              onDelete={(noteId) => {
                if (expandedId)
                  deleteNote.mutate({ id: noteId, dealId: expandedId });
              }}
            />
          ),
        },
      ]
    : [];

  // View toggle buttons for toolbar extra slot
  const viewToggle = (
    <div className="flex h-7 rounded-md border">
      <button
        type="button"
        onClick={() => setView("table")}
        className={`flex items-center justify-center rounded-l-md px-2 text-muted-foreground transition-colors ${
          view === "table"
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        }`}
      >
        <LayoutList className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setView("board")}
        className={`flex items-center justify-center rounded-r-md border-l px-2 text-muted-foreground transition-colors ${
          view === "board"
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        }`}
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </div>
  );

  if (!isPending && rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Handshake className="size-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No deals yet</p>
          <p className="text-[12px] text-muted-foreground">
            Track your pipeline by adding your first deal.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          className="h-7 gap-1 text-[13px]"
        >
          <Plus className="size-3.5" />
          New Deal
        </Button>
        <DealSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          deal={null}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {view === "board" ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Minimal header for board view */}
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {data?.total ?? 0} record{(data?.total ?? 0) !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              {viewToggle}
              <Button
                size="sm"
                onClick={handleNew}
                className="h-7 gap-1 text-[13px]"
              >
                <Plus className="size-3.5" />
                New Deal
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <DealsKanban deals={data?.data ?? []} onDealClick={handleDealClick} />
          </div>
        </div>
      ) : (
        <SpreadsheetGrid
          resource="deals"
          data={rows}
          total={data?.total}
          isLoading={isPending}
          onCellUpdate={handleCellUpdate}
          hiddenColumns={["salesId", "contactIds"]}
          onRowExpand={(row) => setExpandedRow(row)}
          onNewRow={handleNew}
          toolbar={viewToggle}
          onBulkDelete={async (ids) => {
            for (const id of ids) await deleteDeal.mutateAsync(id);
          }}
        />
      )}

      <ExpandedRowModal
        open={!!expandedRow}
        onOpenChange={(open) => {
          if (!open) setExpandedRow(null);
        }}
        resource="deals"
        row={expandedRow}
        title={(expandedRow?.name as string) ?? "Untitled"}
        onFieldUpdate={handleCellUpdate}
        onDelete={(id) => {
          deleteDeal.mutate(id);
          setExpandedRow(null);
        }}
        hiddenColumns={["salesId", "contactIds"]}
        extraTabs={notesTabs}
        allRows={rows}
        onNavigateRow={(row) => setExpandedRow(row)}
      />

      <DealSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        deal={null}
      />
    </div>
  );
}

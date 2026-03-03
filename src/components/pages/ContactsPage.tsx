import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import {
  useContacts,
  useDeleteContact,
  useUpdateContact,
  type ContactSummary,
} from "@/hooks/use-contacts";
import {
  useContactNotes,
  useCreateContactNote,
  useDeleteContactNote,
} from "@/hooks/use-contact-notes";
import { ContactSheet } from "@/components/sheets/ContactSheet";
import { SpreadsheetGrid } from "@/components/spreadsheet";
import {
  ExpandedRowModal,
  type ExpandedRowTab,
} from "@/components/spreadsheet/ExpandedRowModal";
import { NotesFeed } from "@/components/notes-feed";

type Row = Record<string, unknown> & { id?: number | string };

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<Row | null>(null);

  const openParam = searchParams.get("open");
  const openNew = openParam === "new";
  const openId =
    openParam && openParam !== "new" ? parseInt(openParam, 10) : null;

  const { data, isPending, isError } = useContacts({
    pagination: { page: 1, perPage: 500 },
  });
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();

  const expandedId = expandedRow?.id ? Number(expandedRow.id) : null;
  const { data: notesData } = useContactNotes(expandedId);
  const createNote = useCreateContactNote();
  const deleteNote = useDeleteContactNote();

  const handleCellUpdate = useCallback(
    (rowId: number | string, field: string, value: unknown) => {
      updateContact.mutate({
        id: Number(rowId),
        data: { [field]: value } as Partial<ContactSummary>,
      });
    },
    [updateContact],
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
        Failed to load contacts.
      </div>
    );
  }

  const rows = (data?.data ?? []) as Row[];
  const expandedTitle = expandedRow
    ? [expandedRow.firstName as string, expandedRow.lastName as string]
        .filter(Boolean)
        .join(" ") || "Untitled"
    : undefined;

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
                  await createNote.mutateAsync({
                    contactId: expandedId,
                    text,
                  });
              }}
              onDelete={(noteId) => {
                if (expandedId)
                  deleteNote.mutate({ id: noteId, contactId: expandedId });
              }}
            />
          ),
        },
      ]
    : [];

  if (!isPending && rows.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Users className="size-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No contacts yet</p>
          <p className="text-[12px] text-muted-foreground">
            Add your first contact to get started.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          className="h-7 gap-1 text-[13px]"
        >
          <Plus className="size-3.5" />
          New Contact
        </Button>
        <ContactSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          contact={null}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SpreadsheetGrid
        resource="contacts_summary"
        data={rows}
        total={data?.total}
        isLoading={isPending}
        onCellUpdate={handleCellUpdate}
        readOnlyColumns={["companyName", "nbTasks"]}
        hiddenColumns={["salesId"]}
        onRowExpand={(row) => setExpandedRow(row)}
        onNewRow={handleNew}
        onBulkDelete={async (ids) => {
          for (const id of ids) await deleteContact.mutateAsync(id);
        }}
      />

      <ExpandedRowModal
        open={!!expandedRow}
        onOpenChange={(open) => {
          if (!open) setExpandedRow(null);
        }}
        resource="contacts_summary"
        row={expandedRow}
        title={expandedTitle}
        onFieldUpdate={handleCellUpdate}
        onDelete={(id) => {
          deleteContact.mutate(id);
          setExpandedRow(null);
        }}
        readOnlyColumns={["companyName", "nbTasks"]}
        extraTabs={notesTabs}
        allRows={rows}
        onNavigateRow={(row) => setExpandedRow(row)}
      />

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={null}
      />
    </div>
  );
}

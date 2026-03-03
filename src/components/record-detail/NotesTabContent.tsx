import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "@phosphor-icons/react";
import { useDealNotes, useCreateDealNote, useDeleteDealNote } from "@/hooks/use-deal-notes";
import { useContactNotes, useCreateContactNote, useDeleteContactNote } from "@/hooks/use-contact-notes";

export function NotesTabContent({
  objectSlug,
  recordId,
}: {
  objectSlug: string;
  recordId: number;
}) {
  const isDeal = objectSlug === "deals";
  const isContact = objectSlug === "contacts";

  const { data: dealNotesData, isPending: dealNotesPending } = useDealNotes(
    isDeal ? recordId : null,
  );
  const createDealNote = useCreateDealNote();
  const deleteDealNote = useDeleteDealNote();

  const { data: contactNotesData, isPending: contactNotesPending } = useContactNotes(
    isContact ? recordId : null,
  );
  const createContactNote = useCreateContactNote();
  const deleteContactNote = useDeleteContactNote();

  const [newNoteText, setNewNoteText] = useState("");
  const notes = isDeal
    ? (dealNotesData?.data ?? [])
    : isContact
      ? (contactNotesData?.data ?? [])
      : [];
  const isLoading = isDeal ? dealNotesPending : contactNotesPending;
  const createMutation = isDeal ? createDealNote : createContactNote;
  const deleteMutation = isDeal ? deleteDealNote : deleteContactNote;

  const handleAddNote = useCallback(() => {
    const text = newNoteText.trim();
    if (!text) return;
    if (isDeal) {
      createDealNote.mutate(
        { dealId: recordId, text },
        {
          onSuccess: () => setNewNoteText(""),
          onError: () => toast.error("Failed to add note"),
        },
      );
    } else if (isContact) {
      createContactNote.mutate(
        { contactId: recordId, text },
        {
          onSuccess: () => setNewNoteText(""),
          onError: () => toast.error("Failed to add note"),
        },
      );
    }
  }, [newNoteText, isDeal, isContact, recordId, createDealNote, createContactNote]);

  const handleDeleteNote = useCallback(
    (id: number, parentId: number) => {
      if (isDeal) {
        deleteDealNote.mutate(
          { id, dealId: parentId },
          { onError: () => toast.error("Failed to delete note") },
        );
      } else if (isContact) {
        deleteContactNote.mutate(
          { id, contactId: parentId },
          { onError: () => toast.error("Failed to delete note") },
        );
      }
    },
    [isDeal, isContact, deleteDealNote, deleteContactNote],
  );

  if (!isDeal && !isContact) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        No notes for this object type.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNoteText.trim() || createMutation.isPending}
          size="sm"
          className="self-end"
        >
          Add note
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No notes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const n = note as unknown as Record<string, unknown>;
            const id = (n.id ?? n.Id) as number;
            const parentId = (n.dealId ?? n.deal_id ?? n.contactId ?? n.contact_id) as number;
            const text = (n.text ?? "") as string;
            const date = (n.date ?? n.Date) as string;
            return (
              <div
                key={id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm whitespace-pre-wrap break-words">{text || "(empty)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteNote(id, parentId)}
                  disabled={deleteMutation.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

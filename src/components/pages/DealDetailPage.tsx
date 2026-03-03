import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeal, useDeleteDeal, useUpdateDeal } from "@/hooks/use-deals";
import { useDealNotes, useCreateDealNote, useDeleteDealNote } from "@/hooks/use-deal-notes";
import { useContacts } from "@/hooks/use-contacts";
import { useCompany } from "@/hooks/use-companies";
import { useRecentItems } from "@/hooks/use-recent-items";
import { DealSheet } from "@/components/sheets/DealSheet";
import { DealStageBadge, ContactStatusBadge } from "@/components/status-badge";
import { NotesFeed } from "@/components/notes-feed";
import { ROUTES } from "@basics-os/hub";
import {
  InlineTextField,
  InlineTextareaField,
  InlineSelectField,
  InlineNumberField,
  InlineDateField,
  type InlineSelectOption,
} from "@/components/inline-edit-field";

const DEAL_STAGE_OPTIONS: InlineSelectOption[] = [
  { value: "opportunity", label: "Opportunity" },
  { value: "proposal-made", label: "Proposal Made" },
  { value: "in-negociation", label: "In Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "delayed", label: "Delayed" },
];

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-28 shrink-0 pt-0.5 text-[12px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-[13px]">{value}</span>
    </div>
  );
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dealId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: deal, isPending, isError } = useDeal(dealId);
  const { data: notesData, isPending: notesPending } = useDealNotes(dealId);
  const { data: companyData } = useCompany(deal?.companyId ?? null);
  const { data: allContactsData } = useContacts({ pagination: { page: 1, perPage: 500 } });

  const createNote = useCreateDealNote();
  const deleteNote = useDeleteDealNote();
  const deleteDeal = useDeleteDeal();
  const updateDeal = useUpdateDeal();
  const [, addRecentItem] = useRecentItems();

  useEffect(() => {
    if (!deal || !dealId) return;
    addRecentItem({ type: "deal", id: dealId, name: deal.name });
  }, [deal, dealId, addRecentItem]);

  const notes = notesData?.data ?? [];
  const company = companyData;
  const dealContacts = (allContactsData?.data ?? []).filter(
    (c) => deal?.contactIds?.includes(c.id)
  );

  const handleDelete = async () => {
    if (!dealId) return;
    try {
      await deleteDeal.mutateAsync(dealId);
      navigate(ROUTES.CRM_DEALS);
    } catch {
      toast.error("Failed to delete deal");
    }
  };

  if (isPending) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !deal) {
    return <div className="p-8 text-center text-destructive">Deal not found.</div>;
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-auto p-4">
        {/* Back */}
        <button
          className="mb-3 flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-fit"
          onClick={() => navigate(ROUTES.CRM_DEALS)}
        >
          <ArrowLeft className="size-3.5" />
          Deals
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <InlineTextField
                value={deal.name}
                onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { name: v } })}
                isSaving={updateDeal.isPending}
                className="min-h-0 rounded px-1 py-0 text-lg font-semibold hover:bg-muted/50"
              />
              <DealStageBadge stage={deal.stage} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              {deal.amount != null && (
                <span className="font-medium text-foreground tabular-nums">{formatCurrency(deal.amount)}</span>
              )}
              {deal.expectedClosingDate && (
                <span>closes {new Date(deal.expectedClosingDate).toLocaleDateString()}</span>
              )}
              {company && (
                <button className="hover:underline text-foreground" onClick={() => navigate(`/companies/${company.id}`)}>
                  {company.name}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[13px]" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[13px] text-destructive hover:text-destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
        </div>

        <div className="h-px bg-border mb-4" />

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Fields */}
          <div className="divide-y divide-border/50">
            <FieldRow label="Name" value={
              <InlineTextField value={deal.name} onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { name: v } })} isSaving={updateDeal.isPending} />
            } />
            <FieldRow label="Stage" value={
              <InlineSelectField value={deal.stage} options={DEAL_STAGE_OPTIONS} onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { stage: v } })} isSaving={updateDeal.isPending} />
            } />
            <FieldRow label="Amount" value={
              <InlineNumberField value={deal.amount} onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { amount: v } })} isSaving={updateDeal.isPending} />
            } />
            <FieldRow label="Category" value={
              <InlineTextField value={deal.category} onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { category: v || null } })} isSaving={updateDeal.isPending} />
            } />
            <FieldRow label="Closing date" value={
              <InlineDateField value={deal.expectedClosingDate} onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { expectedClosingDate: v } })} isSaving={updateDeal.isPending} />
            } />
            <FieldRow label="Created" value={new Date(deal.createdAt).toLocaleDateString()} />
            <FieldRow label="Updated" value={new Date(deal.updatedAt).toLocaleDateString()} />
            {company && (
              <div className="flex items-start gap-2 py-1.5">
                <span className="w-28 shrink-0 pt-0.5 text-[12px] text-muted-foreground">Company</span>
                <button className="text-[13px] hover:underline" onClick={() => navigate(`/companies/${company.id}`)}>
                  {company.name}
                </button>
              </div>
            )}
            <div className="py-1.5">
              <p className="text-[12px] text-muted-foreground mb-1">Description</p>
              <InlineTextareaField
                value={deal.description}
                onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { description: v || null } })}
                isSaving={updateDeal.isPending}
                rows={3}
              />
            </div>
            {deal.customFields && Object.keys(deal.customFields).length > 0 && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 py-2">Custom Fields</p>
                {Object.entries(deal.customFields).map(([k, v]) => (
                  <FieldRow key={k} label={k} value={String(v ?? "")} />
                ))}
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="notes">
            <TabsList className="h-8 gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="notes" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Notes {notes.length > 0 && `(${notes.length})`}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Contacts {dealContacts.length > 0 && `(${dealContacts.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-3">
              <NotesFeed
                notes={notes}
                isLoading={notesPending}
                onAdd={async (text) => { await createNote.mutateAsync({ dealId: dealId!, text }); }}
                onDelete={(noteId) => deleteNote.mutate({ id: noteId, dealId: dealId! })}
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-3">
              {dealContacts.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">No contacts linked.</p>
              ) : (
                <div className="space-y-1">
                  {dealContacts.map((c) => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unnamed";
                    return (
                      <button
                        key={c.id}
                        className="w-full text-left rounded-md border border-border/50 p-2.5 hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium">{name}</span>
                          {c.status && <ContactStatusBadge status={c.status} />}
                        </div>
                        {c.title && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.title}</p>}
                        {c.companyName && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.companyName}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DealSheet open={editOpen} onOpenChange={setEditOpen} deal={deal} />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{deal.name}"?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteDeal.isPending}>
              {deleteDeal.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex gap-3 py-2">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
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

  // Load all contacts, then filter by contactIds array
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
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !deal) {
    return <div className="p-8 text-center text-destructive">Deal not found.</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => navigate(ROUTES.CRM_DEALS)}
        >
          <ArrowLeft className="h-4 w-4" />
          Deals
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-2xl font-semibold tracking-tight">
                <InlineTextField
                  value={deal.name}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { name: v } })}
                  isSaving={updateDeal.isPending}
                  className="min-h-0 rounded px-1 py-0.5 text-2xl font-semibold hover:bg-muted/50"
                />
              </div>
              <DealStageBadge stage={deal.stage} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {deal.amount != null && (
                <span className="font-medium text-foreground">{formatCurrency(deal.amount)}</span>
              )}
              {deal.expectedClosingDate && (
                <span>closes {new Date(deal.expectedClosingDate).toLocaleDateString()}</span>
              )}
              {company && (
                <button
                  className="hover:underline text-foreground"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  {company.name}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <Separator />

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left: fields */}
          <div className="space-y-1 divide-y">
            <FieldRow
              label="Name"
              value={
                <InlineTextField
                  value={deal.name}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { name: v } })}
                  isSaving={updateDeal.isPending}
                />
              }
            />
            <FieldRow
              label="Stage"
              value={
                <InlineSelectField
                  value={deal.stage}
                  options={DEAL_STAGE_OPTIONS}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { stage: v } })}
                  isSaving={updateDeal.isPending}
                />
              }
            />
            <FieldRow
              label="Amount"
              value={
                <InlineNumberField
                  value={deal.amount}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { amount: v } })}
                  isSaving={updateDeal.isPending}
                />
              }
            />
            <FieldRow
              label="Category"
              value={
                <InlineTextField
                  value={deal.category}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { category: v || null } })}
                  isSaving={updateDeal.isPending}
                />
              }
            />
            <FieldRow
              label="Closing date"
              value={
                <InlineDateField
                  value={deal.expectedClosingDate}
                  onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { expectedClosingDate: v } })}
                  isSaving={updateDeal.isPending}
                />
              }
            />
            <FieldRow label="Created" value={new Date(deal.createdAt).toLocaleDateString()} />
            <FieldRow label="Updated" value={new Date(deal.updatedAt).toLocaleDateString()} />
            {company && (
              <div className="flex gap-3 py-2">
                <span className="w-36 shrink-0 text-sm text-muted-foreground">Company</span>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  {company.name}
                </button>
              </div>
            )}
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <InlineTextareaField
                value={deal.description}
                onSave={async (v) => updateDeal.mutateAsync({ id: dealId!, data: { description: v || null } })}
                isSaving={updateDeal.isPending}
                rows={3}
              />
            </div>
            {deal.customFields && Object.keys(deal.customFields).length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground py-2">Custom Fields</p>
                {Object.entries(deal.customFields).map(([k, v]) => (
                  <FieldRow key={k} label={k} value={String(v ?? "")} />
                ))}
              </>
            )}
          </div>

          {/* Right: tabs */}
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes">Notes {notes.length > 0 && `(${notes.length})`}</TabsTrigger>
              <TabsTrigger value="contacts">Contacts {dealContacts.length > 0 && `(${dealContacts.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-4">
              <NotesFeed
                notes={notes}
                isLoading={notesPending}
                onAdd={async (text) => {
                  await createNote.mutateAsync({ dealId: dealId!, text });
                }}
                onDelete={(noteId) =>
                  deleteNote.mutate({ id: noteId, dealId: dealId! })
                }
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              {dealContacts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No contacts linked.</p>
              ) : (
                <div className="space-y-2">
                  {dealContacts.map((c) => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unnamed";
                    return (
                      <button
                        key={c.id}
                        className="w-full text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                        onClick={() => navigate(`/contacts/${c.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{name}</span>
                          {c.status && <ContactStatusBadge status={c.status} />}
                        </div>
                        {c.title && <p className="mt-0.5 text-xs text-muted-foreground">{c.title}</p>}
                        {c.companyName && <p className="mt-0.5 text-xs text-muted-foreground">{c.companyName}</p>}
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
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDeal.isPending}>
              {deleteDeal.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

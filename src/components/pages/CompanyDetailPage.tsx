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
import { useCompany, useDeleteCompany, useUpdateCompany } from "@/hooks/use-companies";
import { useContacts } from "@/hooks/use-contacts";
import { useDeals } from "@/hooks/use-deals";
import { useRecentItems } from "@/hooks/use-recent-items";
import { CompanySheet } from "@/components/sheets/CompanySheet";
import { SectorBadge, DealStageBadge, ContactStatusBadge } from "@/components/status-badge";
import { ROUTES } from "@basics-os/hub";
import {
  InlineTextField,
  InlineTextareaField,
  InlineSelectField,
  type InlineSelectOption,
} from "@/components/inline-edit-field";

const SECTOR_OPTIONS: InlineSelectOption[] = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Logo({ src, name, size = "lg" }: { src?: string | null; name: string; size?: "lg" | "sm" }) {
  const initials = name.slice(0, 2).toUpperCase();
  const cls = size === "lg" ? "h-16 w-16 text-xl" : "h-9 w-9 text-sm";
  if (src) {
    return <img src={src} alt={name} className={`${cls} rounded-lg object-cover`} />;
  }
  return (
    <div className={`${cls} rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary`}>
      {initials}
    </div>
  );
}

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: company, isPending, isError } = useCompany(companyId);
  const { data: contactsData } = useContacts({
    filter: { company_id: companyId },
    pagination: { page: 1, perPage: 50 },
  });
  const { data: dealsData } = useDeals({ pagination: { page: 1, perPage: 100 } });

  const deleteCompany = useDeleteCompany();
  const updateCompany = useUpdateCompany();
  const [, addRecentItem] = useRecentItems();

  useEffect(() => {
    if (!company || !companyId) return;
    addRecentItem({ type: "company", id: companyId, name: company.name });
  }, [company, companyId, addRecentItem]);

  const contacts = contactsData?.data ?? [];
  const companyDeals = (dealsData?.data ?? []).filter((d) => d.companyId === companyId);

  const handleDelete = async () => {
    if (!companyId) return;
    try {
      await deleteCompany.mutateAsync(companyId);
      navigate(ROUTES.CRM_COMPANIES);
    } catch {
      toast.error("Failed to delete company");
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

  if (isError || !company) {
    return <div className="p-8 text-center text-destructive">Company not found.</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => navigate(ROUTES.CRM_COMPANIES)}
        >
          <ArrowLeft className="h-4 w-4" />
          Companies
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo src={company.logo?.src} name={company.name} />
            <div className="min-w-0">
              <div className="text-2xl font-semibold tracking-tight">
                <InlineTextField
                  value={company.name}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { name: v } })}
                  isSaving={updateCompany.isPending}
                  className="min-h-0 rounded px-1 py-0.5 text-2xl font-semibold hover:bg-muted/50"
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {company.sector && <SectorBadge sector={company.sector} />}
                {company.city && <span>{company.city}</span>}
                {company.city && company.country && <span>·</span>}
                {company.country && <span>{company.country}</span>}
              </div>
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
                  value={company.name}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { name: v } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow
              label="Sector"
              value={
                <InlineSelectField
                  value={company.sector}
                  options={SECTOR_OPTIONS}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { sector: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow
              label="Website"
              value={
                <InlineTextField
                  value={company.website}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { website: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow
              label="City"
              value={
                <InlineTextField
                  value={company.city}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { city: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow
              label="Country"
              value={
                <InlineTextField
                  value={company.country}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { country: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow
              label="Phone"
              value={
                <InlineTextField
                  value={company.phoneNumber}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { phoneNumber: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow label="Address" value={company.address} />
            <FieldRow label="Size" value={company.size ? `${company.size} employees` : null} />
            <FieldRow label="Revenue" value={company.revenue} />
            <FieldRow
              label="LinkedIn"
              value={
                <InlineTextField
                  value={company.linkedinUrl}
                  onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { linkedinUrl: v || null } })}
                  isSaving={updateCompany.isPending}
                />
              }
            />
            <FieldRow label="Created" value={company.createdAt ? new Date(company.createdAt).toLocaleDateString() : null} />
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <InlineTextareaField
                value={company.description}
                onSave={async (v) => updateCompany.mutateAsync({ id: companyId!, data: { description: v || null } })}
                isSaving={updateCompany.isPending}
                rows={3}
              />
            </div>
            {company.customFields && Object.keys(company.customFields).length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground py-2">Custom Fields</p>
                {Object.entries(company.customFields).map(([k, v]) => (
                  <FieldRow key={k} label={k} value={String(v ?? "")} />
                ))}
              </>
            )}
          </div>

          {/* Right: tabs */}
          <Tabs defaultValue="contacts">
            <TabsList>
              <TabsTrigger value="contacts">Contacts {contacts.length > 0 && `(${contacts.length})`}</TabsTrigger>
              <TabsTrigger value="deals">Deals {companyDeals.length > 0 && `(${companyDeals.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="mt-4">
              {contacts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No contacts linked.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => {
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
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              {companyDeals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No deals linked.</p>
              ) : (
                <div className="space-y-2">
                  {companyDeals.map((d) => (
                    <button
                      key={d.id}
                      className="w-full text-left rounded-md border bg-card p-3 hover:bg-accent transition-colors"
                      onClick={() => navigate(`/deals/${d.id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{d.name}</span>
                        <DealStageBadge stage={d.stage} />
                      </div>
                      {d.amount != null && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(d.amount)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CompanySheet open={editOpen} onOpenChange={setEditOpen} company={company} />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {company.name}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Contacts linked to this company will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCompany.isPending}>
              {deleteCompany.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

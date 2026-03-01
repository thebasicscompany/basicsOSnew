import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useCompany,
  type Company,
  type CompanySummary,
} from "@/hooks/use-companies";
import { useCustomFieldDefs } from "@/hooks/use-custom-field-defs";
import { CustomFieldInput } from "@/components/custom-field-input";

const EMPTY: Partial<Company> = {
  name: "",
  sector: "",
  website: "",
  city: "",
  country: "",
  phoneNumber: "",
  description: "",
  customFields: {},
};

interface CompanySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | CompanySummary | null;
}

export function CompanySheet({
  open,
  onOpenChange,
  company,
}: CompanySheetProps) {
  const isEdit = !!company;
  const [form, setForm] = useState<Partial<Company>>(EMPTY);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: fullCompany } = useCompany(company?.id ?? null);
  const { data: customDefs = [] } = useCustomFieldDefs("companies");
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  useEffect(() => {
    setForm(fullCompany ?? company ?? EMPTY);
  }, [fullCompany, company, open]);

  const set = (field: keyof Company, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setCustom = (name: string, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      customFields: { ...(prev.customFields ?? {}), [name]: value },
    }));

  const handleSubmit = async () => {
    try {
      if (isEdit && company) {
        await updateCompany.mutateAsync({ id: company.id, data: form });
      } else {
        await createCompany.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save company");
    }
  };

  const handleDelete = async () => {
    if (!company) return;
    try {
      await deleteCompany.mutateAsync(company.id);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete company");
    }
  };

  const displayName = (company as CompanySummary)?.name || "this company";

  const isPending = createCompany.isPending || updateCompany.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit Company" : "New Company"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Input
                value={form.sector ?? ""}
                onChange={(e) => set("sector", e.target.value)}
                placeholder="e.g. Technology, Healthcare"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={form.country ?? ""}
                  onChange={(e) => set("country", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phoneNumber ?? ""}
                onChange={(e) => set("phoneNumber", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>

            {customDefs.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Custom Fields
                </p>
                {customDefs.map((def) => (
                  <div key={def.id} className="space-y-1.5">
                    <Label>{def.label}</Label>
                    <CustomFieldInput
                      def={def}
                      value={form.customFields?.[def.name]}
                      onChange={(val) => setCustom(def.name, val)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <SheetFooter className="flex justify-between">
            {isEdit && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleteCompany.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {displayName}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Contacts linked to this company will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCompany.isPending}
            >
              {deleteCompany.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

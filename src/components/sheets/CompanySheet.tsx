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

const EMPTY: Partial<Company> = {
  name: "",
  sector: "",
  website: "",
  city: "",
  country: "",
  phoneNumber: "",
  description: "",
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
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  useEffect(() => {
    setForm(fullCompany ?? company ?? EMPTY);
  }, [fullCompany, company, open]);

  const set = (field: keyof Company, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
            <SheetTitle className="text-[15px]">{isEdit ? "Edit Company" : "New Company"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Company name"
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Sector</Label>
              <Input
                value={form.sector ?? ""}
                onChange={(e) => set("sector", e.target.value)}
                placeholder="e.g. Technology, Healthcare"
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Website</Label>
              <Input
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
                className="h-8 text-[13px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[12px]">City</Label>
                <Input
                  value={form.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                  className="h-8 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">Country</Label>
                <Input
                  value={form.country ?? ""}
                  onChange={(e) => set("country", e.target.value)}
                  className="h-8 text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Phone</Label>
              <Input
                value={form.phoneNumber ?? ""}
                onChange={(e) => set("phoneNumber", e.target.value)}
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="text-[13px]"
              />
            </div>
          </div>

          <SheetFooter className="flex justify-between">
            {isEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[13px] text-destructive hover:text-destructive"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleteCompany.isPending}
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[13px]" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 text-[13px]" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving…" : isEdit ? "Save" : "Create"}
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
            <Button variant="outline" size="sm" className="h-7 text-[13px]" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-[13px]"
              onClick={handleDelete}
              disabled={deleteCompany.isPending}
            >
              {deleteCompany.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

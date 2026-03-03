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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useDeal,
  type Deal,
} from "@/hooks/use-deals";

const DEAL_STAGES = [
  "opportunity",
  "proposal-made",
  "in-negociation",
  "won",
  "lost",
  "delayed",
] as const;

const EMPTY: Partial<Deal> = {
  name: "",
  stage: "opportunity",
  category: "",
  amount: null,
  expectedClosingDate: null,
  description: "",
};

interface DealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
}

export function DealSheet({ open, onOpenChange, deal }: DealSheetProps) {
  const isEdit = !!deal;
  const [form, setForm] = useState<Partial<Deal>>(EMPTY);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: fullDeal } = useDeal(deal?.id ?? null);
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  useEffect(() => {
    setForm(fullDeal ?? deal ?? EMPTY);
  }, [fullDeal, deal, open]);

  const set = (field: keyof Deal, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    try {
      if (isEdit && deal) {
        await updateDeal.mutateAsync({ id: deal.id, data: form });
      } else {
        await createDeal.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save deal");
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    try {
      await deleteDeal.mutateAsync(deal.id);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete deal");
    }
  };

  const displayName = deal?.name || "this deal";
  const isPending = createDeal.isPending || updateDeal.isPending;

  const closingDateValue = form.expectedClosingDate
    ? typeof form.expectedClosingDate === "string"
      ? form.expectedClosingDate.slice(0, 10)
      : new Date(form.expectedClosingDate).toISOString().slice(0, 10)
    : "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[15px]">{isEdit ? "Edit Deal" : "New Deal"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label className="text-[12px]">Name</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Deal name"
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Stage</Label>
              <Select
                value={form.stage ?? "opportunity"}
                onValueChange={(v) => set("stage", v)}
              >
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Category</Label>
              <Input
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Amount</Label>
              <Input
                type="number"
                value={form.amount ?? ""}
                onChange={(e) =>
                  set(
                    "amount",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="0"
                className="h-8 text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px]">Expected closing date</Label>
              <Input
                type="date"
                value={closingDateValue}
                onChange={(e) =>
                  set("expectedClosingDate", e.target.value || null)
                }
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
                disabled={deleteDeal.isPending}
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
            <DialogTitle>Delete "{displayName}"?</DialogTitle>
            <DialogDescription>
              This cannot be undone.
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
              disabled={deleteDeal.isPending}
            >
              {deleteDeal.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

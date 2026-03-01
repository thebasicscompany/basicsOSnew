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
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useContact,
  type Contact,
  type ContactSummary,
} from "@/hooks/use-contacts";
import { useCustomFieldDefs } from "@/hooks/use-custom-field-defs";
import { CustomFieldInput } from "@/components/custom-field-input";

const EMPTY: Partial<Contact> = {
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  status: "",
  background: "",
  customFields: {},
};

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | ContactSummary | null;
}

export function ContactSheet({
  open,
  onOpenChange,
  contact,
}: ContactSheetProps) {
  const isEdit = !!contact;
  const [form, setForm] = useState<Partial<Contact>>(EMPTY);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: fullContact } = useContact(contact?.id ?? null);
  const { data: customDefs = [] } = useCustomFieldDefs("contacts");
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  useEffect(() => {
    setForm(fullContact ?? contact ?? EMPTY);
  }, [fullContact, contact, open]);

  const set = (field: keyof Contact, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setCustom = (name: string, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      customFields: { ...(prev.customFields ?? {}), [name]: value },
    }));

  const handleSubmit = async () => {
    try {
      if (isEdit && contact) {
        await updateContact.mutateAsync({ id: contact.id, data: form });
      } else {
        await createContact.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save contact");
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    try {
      await deleteContact.mutateAsync(contact.id);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const displayName = contact
    ? `${(contact as ContactSummary).firstName ?? ""} ${(contact as ContactSummary).lastName ?? ""}`.trim() || "this contact"
    : "this contact";

  const isPending = createContact.isPending || updateContact.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Edit Contact" : "New Contact"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  value={form.firstName ?? ""}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  value={form.lastName ?? ""}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Title / Role</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Input
                value={form.status ?? ""}
                onChange={(e) => set("status", e.target.value)}
                placeholder="e.g. warm, cold, hot"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Background</Label>
              <Textarea
                value={form.background ?? ""}
                onChange={(e) => set("background", e.target.value)}
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
                disabled={deleteContact.isPending}
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
              This cannot be undone. All tasks and notes linked to this contact will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

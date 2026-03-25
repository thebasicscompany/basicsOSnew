import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface RecordBulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  singularName: string;
  pluralName: string;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
}

export function RecordBulkDeleteDialog({
  open,
  onOpenChange,
  count,
  singularName,
  pluralName,
  onConfirm,
  isDeleting,
}: RecordBulkDeleteDialogProps) {
  const title =
    count === 1
      ? `Delete this ${singularName.toLowerCase()}?`
      : `Delete ${count} ${pluralName.toLowerCase()}?`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

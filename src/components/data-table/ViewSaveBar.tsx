import { Button } from "@/components/ui/button";

export interface ViewSaveBarProps {
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function ViewSaveBar({ isDirty, onSave, onDiscard }: ViewSaveBarProps) {
  if (!isDirty) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="text-xs text-muted-foreground mr-auto">
        You have unsaved changes to this view
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={onDiscard}
      >
        Discard changes
      </Button>
      <Button size="sm" className="h-7 text-xs" onClick={onSave}>
        Save for everyone
      </Button>
    </div>
  );
}

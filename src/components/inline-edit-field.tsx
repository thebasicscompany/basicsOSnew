import { useState, useEffect, useRef } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const displayClass =
  "min-h-8 cursor-text rounded px-1.5 py-0.5 text-sm hover:bg-muted/50 flex items-center gap-1.5 group";

interface InlineTextFieldProps {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  isSaving?: boolean;
  className?: string;
}

export function InlineTextField({
  value,
  onSave,
  placeholder = "—",
  isSaving = false,
  className,
}: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const v = draft.trim();
    if (v !== (value ?? "")) await onSave(v);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-8 text-sm"
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(displayClass, className)}
    >
      {value?.trim() || <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </span>
  );
}

interface InlineTextareaFieldProps {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  isSaving?: boolean;
  rows?: number;
  className?: string;
}

export function InlineTextareaField({
  value,
  onSave,
  placeholder = "—",
  isSaving = false,
  rows = 3,
  className,
}: InlineTextareaFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const v = draft.trim();
    if (v !== (value ?? "")) await onSave(v);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          rows={rows}
          className="text-sm resize-none"
        />
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(displayClass, "whitespace-pre-wrap", className)}
    >
      {value?.trim() || <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </span>
  );
}

export interface InlineSelectOption {
  value: string;
  label: string;
}

interface InlineSelectFieldProps {
  value: string | null;
  options: InlineSelectOption[];
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  isSaving?: boolean;
  className?: string;
}

export function InlineSelectField({
  value,
  options,
  onSave,
  placeholder = "—",
  isSaving = false,
  className,
}: InlineSelectFieldProps) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (editing) setOpen(true);
  }, [editing]);

  const handleChange = async (v: string) => {
    if (v !== (value ?? "")) await onSave(v);
    setEditing(false);
    setOpen(false);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Select
          open={open}
          onOpenChange={setOpen}
          value={value ?? ""}
          onValueChange={handleChange}
        >
          <SelectTrigger size="sm" className="h-8 text-sm min-w-[120px]">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  const label = options.find((o) => o.value === value)?.label ?? value ?? placeholder;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(displayClass, className)}
    >
      {value ? label : <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </span>
  );
}

interface InlineNumberFieldProps {
  value: number | null;
  onSave: (value: number | null) => Promise<void>;
  placeholder?: string;
  isSaving?: boolean;
  className?: string;
}

export function InlineNumberField({
  value,
  onSave,
  placeholder = "—",
  isSaving = false,
  className,
}: InlineNumberFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value != null ? String(value) : "");
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const num = draft === "" ? null : Number(draft);
    if (Number.isNaN(num)) return cancel();
    if (num !== value) await onSave(num);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value != null ? String(value) : "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-8 text-sm w-28"
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(displayClass, className)}
    >
      {value != null ? value : <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </span>
  );
}

interface InlineDateFieldProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  isSaving?: boolean;
  className?: string;
}

export function InlineDateField({
  value,
  onSave,
  placeholder = "—",
  isSaving = false,
  className,
}: InlineDateFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const v = draft.trim() || null;
    if (v !== (value ?? "")) await onSave(v);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Input
          ref={inputRef}
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-8 text-sm w-36"
        />
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(displayClass, className)}
    >
      {value ? new Date(value).toLocaleDateString() : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </span>
  );
}

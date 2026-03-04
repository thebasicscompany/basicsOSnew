import type { FormInputProps } from "@/field-types/types";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function LongTextFormInput({
  value,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${attribute.name.toLowerCase()}...`}
        className={cn("min-h-24", error && "border-destructive")}
        rows={4}
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

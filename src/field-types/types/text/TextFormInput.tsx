import type { FormInputProps } from "@/field-types/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TextFormInput({
  value,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${attribute.name.toLowerCase()}...`}
        className={cn(error && "border-destructive")}
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

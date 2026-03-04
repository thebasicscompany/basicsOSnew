import type { FormInputProps } from "@/field-types/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NumberFormInput({
  value,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        type="text"
        inputMode="numeric"
        value={value != null ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
          } else {
            const num = Number(raw);
            if (!isNaN(num)) onChange(num);
          }
        }}
        placeholder={`Enter ${attribute.name.toLowerCase()}...`}
        className={cn("text-right tabular-nums", error && "border-destructive")}
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

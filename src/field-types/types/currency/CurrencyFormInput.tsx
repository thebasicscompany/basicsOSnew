import { useState } from "react";
import type { FormInputProps } from "@/field-types/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CurrencyFormInput({ value, onChange, error }: FormInputProps) {
  const [draft, setDraft] = useState<string>(
    value != null ? String(value) : "",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    if (raw === "") {
      onChange(null);
    } else {
      const num = Number(raw);
      if (!isNaN(num)) onChange(num);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
          $
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={handleChange}
          placeholder="0.00"
          className={cn(
            "pl-7 text-right tabular-nums",
            error && "border-destructive",
          )}
        />
      </div>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}

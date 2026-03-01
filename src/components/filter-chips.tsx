import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function FilterChips({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Button
        variant={value === null ? "secondary" : "ghost"}
        size="sm"
        className="h-7 rounded-full px-2.5 text-xs"
        onClick={() => onChange(null)}
      >
        All
      </Button>
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "secondary" : "ghost"}
          size="sm"
          className="h-7 rounded-full px-2.5 text-xs"
          onClick={() => onChange(opt.value === value ? null : opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

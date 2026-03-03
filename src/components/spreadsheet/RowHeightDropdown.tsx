import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ALargeSmall, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RowHeight } from "@/hooks/use-grid-preferences";

interface RowHeightDropdownProps {
  value: RowHeight;
  onChange: (value: RowHeight) => void;
}

const OPTIONS: { value: RowHeight; label: string; lines: number }[] = [
  { value: "short", label: "Short", lines: 1 },
  { value: "medium", label: "Medium", lines: 2 },
  { value: "tall", label: "Tall", lines: 3 },
  { value: "extra", label: "Extra", lines: 4 },
];

export function RowHeightDropdown({ value, onChange }: RowHeightDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <ALargeSmall className="size-3.5" />
          <span className="hidden sm:inline">Height</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-2"
          >
            {/* Visual preview: horizontal lines */}
            <div className="flex w-5 flex-col items-stretch gap-[2px]">
              {Array.from({ length: opt.lines }, (_, i) => (
                <div
                  key={i}
                  className="h-[2px] rounded-full bg-muted-foreground/40"
                />
              ))}
            </div>
            <span className="flex-1 text-xs">{opt.label}</span>
            {value === opt.value && (
              <Check className="size-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

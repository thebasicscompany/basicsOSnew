import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color mapping for column headers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<
  string,
  { dot: string; border: string; bg: string; bgDark: string }
> = {
  blue: {
    dot: "bg-blue-500",
    border: "border-t-blue-500",
    bg: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
  },
  cyan: {
    dot: "bg-cyan-500",
    border: "border-t-cyan-500",
    bg: "bg-cyan-50",
    bgDark: "dark:bg-cyan-950/30",
  },
  teal: {
    dot: "bg-teal-500",
    border: "border-t-teal-500",
    bg: "bg-teal-50",
    bgDark: "dark:bg-teal-950/30",
  },
  green: {
    dot: "bg-green-500",
    border: "border-t-green-500",
    bg: "bg-green-50",
    bgDark: "dark:bg-green-950/30",
  },
  lime: {
    dot: "bg-lime-500",
    border: "border-t-lime-500",
    bg: "bg-lime-50",
    bgDark: "dark:bg-lime-950/30",
  },
  yellow: {
    dot: "bg-yellow-500",
    border: "border-t-yellow-500",
    bg: "bg-yellow-50",
    bgDark: "dark:bg-yellow-950/30",
  },
  orange: {
    dot: "bg-orange-500",
    border: "border-t-orange-500",
    bg: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
  },
  red: {
    dot: "bg-red-500",
    border: "border-t-red-500",
    bg: "bg-red-50",
    bgDark: "dark:bg-red-950/30",
  },
  pink: {
    dot: "bg-pink-500",
    border: "border-t-pink-500",
    bg: "bg-pink-50",
    bgDark: "dark:bg-pink-950/30",
  },
  purple: {
    dot: "bg-purple-500",
    border: "border-t-purple-500",
    bg: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
  },
  violet: {
    dot: "bg-violet-500",
    border: "border-t-violet-500",
    bg: "bg-violet-50",
    bgDark: "dark:bg-violet-950/30",
  },
  indigo: {
    dot: "bg-indigo-500",
    border: "border-t-indigo-500",
    bg: "bg-indigo-50",
    bgDark: "dark:bg-indigo-950/30",
  },
  gray: {
    dot: "bg-gray-500",
    border: "border-t-gray-500",
    bg: "bg-gray-50",
    bgDark: "dark:bg-gray-950/30",
  },
  slate: {
    dot: "bg-slate-500",
    border: "border-t-slate-500",
    bg: "bg-slate-50",
    bgDark: "dark:bg-slate-950/30",
  },
  zinc: {
    dot: "bg-zinc-500",
    border: "border-t-zinc-500",
    bg: "bg-zinc-50",
    bgDark: "dark:bg-zinc-950/30",
  },
  emerald: {
    dot: "bg-emerald-500",
    border: "border-t-emerald-500",
    bg: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
  },
  amber: {
    dot: "bg-amber-500",
    border: "border-t-amber-500",
    bg: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
  },
  rose: {
    dot: "bg-rose-500",
    border: "border-t-rose-500",
    bg: "bg-rose-50",
    bgDark: "dark:bg-rose-950/30",
  },
  fuchsia: {
    dot: "bg-fuchsia-500",
    border: "border-t-fuchsia-500",
    bg: "bg-fuchsia-50",
    bgDark: "dark:bg-fuchsia-950/30",
  },
  sky: {
    dot: "bg-sky-500",
    border: "border-t-sky-500",
    bg: "bg-sky-50",
    bgDark: "dark:bg-sky-950/30",
  },
};

const DEFAULT_COLOR = COLOR_MAP.gray;

export function getColumnColors(color: string) {
  const normalized = color.toLowerCase().trim();
  return COLOR_MAP[normalized] ?? DEFAULT_COLOR;
}

// ---------------------------------------------------------------------------
// KanbanColumn
// ---------------------------------------------------------------------------

export interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
  isOver?: boolean;
  singularName?: string;
  onNewRecord?: () => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
  isOver,
  singularName = "record",
  onNewRecord,
}: KanbanColumnProps) {
  const colors = getColumnColors(color);

  return (
    <div
      data-column-id={id}
      className={cn(
        "flex w-[280px] min-w-[280px] flex-col rounded-lg border-t-2",
        colors.border,
        isOver && [colors.bg, colors.bgDark],
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", colors.dot)}
          aria-hidden
        />
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>

      {/* Card list -- scrollable */}
      <ScrollArea className="max-h-[calc(100vh-220px)] flex-1">
        <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
      </ScrollArea>

      {/* Footer: new record button */}
      {onNewRecord && (
        <div className="px-2 pb-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-1.5 text-muted-foreground"
            onClick={onNewRecord}
          >
            <Plus className="size-4" />
            New {singularName}
          </Button>
        </div>
      )}
    </div>
  );
}

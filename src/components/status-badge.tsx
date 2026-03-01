import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONTACT_STATUS_STYLES: Record<string, string> = {
  cold: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  warm: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  hot: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  "in-contract": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  unqualified: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const DEAL_STAGE_STYLES: Record<string, string> = {
  opportunity: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "proposal-made": "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  "in-negociation": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  lost: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  delayed: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
};

const DEAL_STAGE_LABELS: Record<string, string> = {
  opportunity: "Opportunity",
  "proposal-made": "Proposal Made",
  "in-negociation": "In Negotiation",
  won: "Won",
  lost: "Lost",
  delayed: "Delayed",
};

const FALLBACK =
  "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";

function toLabel(value: string): string {
  return value
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ContactStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <Badge variant="outline" className={cn(CONTACT_STATUS_STYLES[status] ?? FALLBACK)}>
      {toLabel(status)}
    </Badge>
  );
}

export function DealStageBadge({ stage }: { stage: string | null }) {
  if (!stage) return null;
  return (
    <Badge variant="outline" className={cn(DEAL_STAGE_STYLES[stage] ?? FALLBACK)}>
      {DEAL_STAGE_LABELS[stage] ?? toLabel(stage)}
    </Badge>
  );
}

export function SectorBadge({ sector }: { sector: string | null }) {
  if (!sector) return null;
  return (
    <Badge variant="outline" className={FALLBACK}>
      {sector}
    </Badge>
  );
}

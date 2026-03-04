import {
  UsersIcon,
  BuildingIcon,
  HandshakeIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";
import { useRecords } from "@/hooks/use-records";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  isPending,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  isPending: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground/50" />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {isPending ? "—" : value}
      </p>
    </div>
  );
}

export function SectionCards() {
  const { data: contacts, isPending: contactsPending } = useRecords(
    "contacts",
    { page: 1, perPage: 1 },
  );
  const { data: companies, isPending: companiesPending } = useRecords(
    "companies",
    { page: 1, perPage: 1 },
  );
  const { data: deals, isPending: dealsPending } = useRecords("deals", {
    page: 1,
    perPage: 200,
  });

  const dealsData = (deals?.data ?? []) as Record<string, any>[];
  const pipelineValue = dealsData.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );
  const openDeals = dealsData.filter(
    (d) => !["won", "lost"].includes(d.stage),
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Contacts"
        value={(contacts?.total ?? 0).toLocaleString()}
        icon={UsersIcon}
        isPending={contactsPending}
      />
      <MetricCard
        label="Companies"
        value={(companies?.total ?? 0).toLocaleString()}
        icon={BuildingIcon}
        isPending={companiesPending}
      />
      <MetricCard
        label="Open Deals"
        value={openDeals.toLocaleString()}
        icon={HandshakeIcon}
        isPending={dealsPending}
      />
      <MetricCard
        label="Pipeline Value"
        value={formatCurrency(pipelineValue)}
        icon={CurrencyDollarIcon}
        isPending={dealsPending}
      />
    </div>
  );
}

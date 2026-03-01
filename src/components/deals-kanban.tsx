import { type Deal } from "@/hooks/use-deals";
import { Card } from "@/components/ui/card";
import { DealStageBadge } from "@/components/status-badge";

const STAGES: { key: string; label: string }[] = [
  { key: "opportunity", label: "Opportunity" },
  { key: "proposal-made", label: "Proposal Made" },
  { key: "in-negociation", label: "In Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "delayed", label: "Delayed" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface DealsKanbanProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function DealsKanban({ deals, onDealClick }: DealsKanbanProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {STAGES.map(({ key }) => {
        const stageDeals = deals.filter((d) => d.stage === key);
        const total = stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

        return (
          <div key={key} className="flex min-w-0 flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-0.5">
              <DealStageBadge stage={key} />
              <span className="text-xs text-muted-foreground">
                {stageDeals.length}{" "}
                {stageDeals.length === 1 ? "deal" : "deals"}
                {total > 0 && ` · ${formatCurrency(total)}`}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {stageDeals.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                  No deals
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-pointer gap-1 rounded-lg py-3 px-3 transition-colors hover:bg-muted/50"
                    onClick={() => onDealClick(deal)}
                  >
                    <p className="truncate text-sm font-medium leading-snug">{deal.name}</p>
                    <div className="flex min-w-0 items-center gap-2">
                      {deal.amount != null && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatCurrency(deal.amount)}
                        </span>
                      )}
                      {deal.category && (
                        <span className="truncate text-xs text-muted-foreground/60">
                          {deal.category}
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

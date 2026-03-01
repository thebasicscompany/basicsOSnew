import { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { type Deal } from "@/hooks/use-deals";
import { useUpdateDeal } from "@/hooks/use-deals";
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

function DealCard({
  deal,
  onDealClick,
  isOverlay,
}: {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
  isOverlay?: boolean;
}) {
  return (
    <Card
      className={
        isOverlay
          ? "cursor-grabbing gap-1 rounded-lg py-3 px-3 shadow-lg ring-2 ring-primary/20"
          : "cursor-grab gap-1 rounded-lg py-3 px-3 transition-colors hover:bg-muted/50 active:cursor-grabbing"
      }
      onClick={() => !isOverlay && onDealClick(deal)}
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
  );
}

function DraggableDealCard({
  deal,
  onDealClick,
}: {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(deal.id),
    data: { deal },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-50" : ""}
    >
      <DealCard deal={deal} onDealClick={onDealClick} />
    </div>
  );
}

function DroppableColumn({
  stageKey,
  children,
}: {
  stageKey: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-0 flex-col gap-2 rounded-lg transition-colors ${
        isOver ? "bg-primary/10 ring-1 ring-primary/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

interface DealsKanbanProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export function DealsKanban({ deals, onDealClick }: DealsKanbanProps) {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const updateDeal = useUpdateDeal();

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as Deal | undefined;
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const deal = event.active.data.current?.deal as Deal | undefined;
    const overId = event.over?.id;
    if (!deal || typeof overId !== "string" || deal.stage === overId) return;
    if (!STAGES.some((s) => s.key === overId)) return;

    setLocalDeals((prev) =>
      prev.map((d) =>
        d.id === deal.id ? { ...d, stage: overId } : d
      )
    );
    updateDeal.mutate({ id: deal.id, data: { stage: overId } });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-6 gap-3">
        {STAGES.map(({ key }) => {
          const stageDeals = localDeals.filter((d) => d.stage === key);
          const total = stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

          return (
            <DroppableColumn key={key} stageKey={key}>
              <div className="flex items-center justify-between px-0.5">
                <DealStageBadge stage={key} />
                <span className="text-xs text-muted-foreground">
                  {stageDeals.length}{" "}
                  {stageDeals.length === 1 ? "deal" : "deals"}
                  {total > 0 && ` · ${formatCurrency(total)}`}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {stageDeals.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DraggableDealCard
                      key={deal.id}
                      deal={deal}
                      onDealClick={onDealClick}
                    />
                  ))
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <DealCard deal={activeDeal} onDealClick={onDealClick} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

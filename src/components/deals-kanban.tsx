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
    <div
      className={
        isOverlay
          ? "cursor-grabbing rounded-md border bg-background p-2.5 shadow-sm"
          : "cursor-grab rounded-md border border-border/50 bg-background p-2.5 transition-colors hover:border-border active:cursor-grabbing"
      }
      onClick={() => !isOverlay && onDealClick(deal)}
    >
      <p className="truncate text-[13px] font-medium leading-snug">{deal.name}</p>
      <div className="mt-1 flex items-center gap-2">
        {deal.amount != null && (
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {formatCurrency(deal.amount)}
          </span>
        )}
        {deal.category && (
          <span className="truncate text-[11px] text-muted-foreground/50">
            {deal.category}
          </span>
        )}
      </div>
    </div>
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
      className={isDragging ? "opacity-30" : ""}
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
      className={`flex min-w-0 flex-col gap-1.5 rounded-md p-1.5 transition-colors ${
        isOver ? "bg-accent/50" : ""
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
      prev.map((d) => (d.id === deal.id ? { ...d, stage: overId } : d))
    );
    updateDeal.mutate({ id: deal.id, data: { stage: overId } });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-6 gap-1">
        {STAGES.map(({ key }) => {
          const stageDeals = localDeals.filter((d) => d.stage === key);
          const total = stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

          return (
            <DroppableColumn key={key} stageKey={key}>
              <div className="flex items-center justify-between px-1 py-1">
                <DealStageBadge stage={key} />
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {stageDeals.length}
                  {total > 0 && ` · ${formatCurrency(total)}`}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {stageDeals.length === 0 ? (
                  <div className="rounded-md border border-dashed py-6 text-center text-[11px] text-muted-foreground/50">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DraggableDealCard key={deal.id} deal={deal} onDealClick={onDealClick} />
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

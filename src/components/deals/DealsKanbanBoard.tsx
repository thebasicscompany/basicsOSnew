import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useRecords, useUpdateRecord } from "@/hooks/use-records";
import { DealStageBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_STAGES = [
  "opportunity",
  "proposal-made",
  "in-negociation",
  "won",
  "lost",
  "delayed",
];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function DealsKanbanBoard() {
  const navigate = useNavigate();
  const { data, isPending } = useRecords("deals", {
    perPage: 200,
    page: 1,
  });
  const updateRecord = useUpdateRecord("deals");

  const deals = (data?.data ?? []) as Record<string, unknown>[];
  const stages = useMemo(() => {
    const stageSet = new Set(DEFAULT_STAGES);
    for (const d of deals) {
      const s = (d.stage ?? d.Stage) as string | undefined;
      if (s) stageSet.add(s);
    }
    return Array.from(stageSet);
  }, [deals]);

  const dealsByStage = useMemo(() => {
    const map: Record<string, typeof deals> = {};
    for (const s of stages) map[s] = [];
    for (const d of deals) {
      const s = ((d.stage ?? d.Stage) as string) || "opportunity";
      if (!map[s]) map[s] = [];
      map[s].push(d);
    }
    return map;
  }, [deals, stages]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || result.destination.droppableId === result.source.droppableId) {
        return;
      }
      const dealId = result.draggableId.replace(/^deal-/, "");
      const targetStage = result.destination.droppableId;
      const id = parseInt(dealId, 10);
      if (isNaN(id)) return;
      updateRecord.mutate({
        id,
        data: { stage: targetStage },
      });
    },
    [updateRecord],
  );

  const handleCardClick = useCallback(
    (dealId: number) => {
      navigate(`/objects/deals/${dealId}`);
    },
    [navigate],
  );

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
          {stages.map((stageId) => (
            <Droppable key={stageId} droppableId={stageId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
                    snapshot.isDraggingOver && "bg-muted/60",
                  )}
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <DealStageBadge stage={stageId} />
                    <span className="text-xs text-muted-foreground">
                      {(dealsByStage[stageId]?.length ?? 0)} deals
                    </span>
                  </div>
                  <div className="min-h-[120px] flex-1 space-y-2 overflow-y-auto p-2">
                    {(dealsByStage[stageId] ?? []).map((deal, index) => {
                      const id = (deal.id ?? deal.Id) as number;
                      const name = (deal.name ?? deal.Name ?? "Deal") as string;
                      const amount = Number(deal.amount ?? deal.Amount ?? 0);
                      return (
                        <Draggable
                          key={`deal-${id}`}
                          draggableId={`deal-${id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(id)}
                              className={cn(
                                "cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                                snapshot.isDragging && "shadow-lg ring-2 ring-primary/50",
                              )}
                            >
                              <p className="font-medium truncate">{name}</p>
                              {amount > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(amount)}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

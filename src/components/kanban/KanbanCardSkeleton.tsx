import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// KanbanCardSkeleton
// ---------------------------------------------------------------------------

interface KanbanCardSkeletonProps {
  /** Number of display-attribute lines to show (default 2) */
  fieldCount?: number;
  className?: string;
}

export function KanbanCardSkeleton({
  fieldCount = 2,
  className,
}: KanbanCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      {/* Primary field skeleton */}
      <Skeleton className="h-4 w-3/4" />

      {/* Display attribute skeletons */}
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KanbanColumnSkeleton -- skeleton for an entire column
// ---------------------------------------------------------------------------

interface KanbanColumnSkeletonProps {
  /** Number of card skeletons (default 3) */
  cardCount?: number;
  /** Number of field lines per card (default 2) */
  fieldCount?: number;
}

export function KanbanColumnSkeleton({
  cardCount = 3,
  fieldCount = 2,
}: KanbanColumnSkeletonProps) {
  return (
    <div className="flex w-[280px] min-w-[280px] flex-col rounded-lg border-t-2 border-t-muted">
      {/* Column header skeleton */}
      <div className="flex items-center gap-2 px-3 py-3">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <div className="ml-auto">
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 px-2 pb-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <KanbanCardSkeleton key={i} fieldCount={fieldCount} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KanbanBoardSkeleton -- skeleton for the entire board
// ---------------------------------------------------------------------------

interface KanbanBoardSkeletonProps {
  /** Number of columns (default 4) */
  columnCount?: number;
  /** Cards per column (default 3) */
  cardsPerColumn?: number;
  /** Fields per card (default 2) */
  fieldsPerCard?: number;
}

export function KanbanBoardSkeleton({
  columnCount = 4,
  cardsPerColumn = 3,
  fieldsPerCard = 2,
}: KanbanBoardSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-hidden pb-4">
      {Array.from({ length: columnCount }).map((_, i) => (
        <KanbanColumnSkeleton
          key={i}
          cardCount={cardsPerColumn}
          fieldCount={fieldsPerCard}
        />
      ))}
    </div>
  );
}

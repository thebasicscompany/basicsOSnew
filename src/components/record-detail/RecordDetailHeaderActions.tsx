import {
  ArrowLeftIcon,
  StarIcon,
  DotsThreeIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RecordDetailHeaderActionsProps {
  listIdsLength: number;
  prevId: number | null;
  nextId: number | null;
  isFavorite: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleteOpen: () => void;
}

export function RecordDetailHeaderActions({
  listIdsLength,
  prevId,
  nextId,
  isFavorite,
  onBack,
  onPrev,
  onNext,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDeleteOpen,
}: RecordDetailHeaderActionsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onBack}
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </Button>
      {listIdsLength > 1 && (
        <div className="flex">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            disabled={prevId == null}
            onClick={onPrev}
          >
            <CaretLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-l-none border-l-0"
            disabled={nextId == null}
            onClick={onNext}
          >
            <CaretRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onToggleFavorite}
      >
        <StarIcon
          className={cn(
            "h-4 w-4",
            isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
          )}
        />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <DotsThreeIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDeleteOpen}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

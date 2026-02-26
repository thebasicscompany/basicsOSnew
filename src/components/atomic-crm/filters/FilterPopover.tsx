import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { useListContext } from "ra-core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const FilterPopover = ({
  children,
  source = "q",
  className,
}: {
  children: React.ReactNode;
  source?: string;
  className?: string;
}) => {
  const { filterValues } = useListContext();

  const activeFiltersCount = Object.entries(filterValues || {}).filter(
    ([key]) => key !== source,
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("relative shrink-0", className)}
          aria-label="Filter"
        >
          <HugeiconsIcon icon={FilterIcon} className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-h-[70vh] overflow-y-auto p-4"
      >
        <div className="flex flex-col gap-6">{children}</div>
      </PopoverContent>
    </Popover>
  );
};

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpDownIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useListSortContext,
  useResourceContext,
  useTranslate,
  useTranslateLabel,
} from "ra-core";
import { FilterButton } from "@/components/admin/filter-form";
import {
  TableToolbarOption,
  tableToolbarOptionClasses,
} from "./table";

type CRMListTableToolbarProps = {
  sortFields: string[];
  toolbarActions?: React.ReactNode;
  className?: string;
};

/**
 * Minimalistic Sort + Filter bar that sits above the table, visually integrated.
 * Basepoint-inspired: small, subtle buttons that blend with the table.
 */
export function CRMListTableToolbar({
  sortFields,
  toolbarActions,
  className,
}: CRMListTableToolbarProps) {
  const { sort, setSort } = useListSortContext();
  const resource = useResourceContext();
  const translate = useTranslate();
  const translateLabel = useTranslateLabel();

  const handleSort = (field: string) => {
    setSort({
      field,
      order: field === sort.field ? (sort.order === "ASC" ? "DESC" : "ASC") : "ASC",
    });
  };

  const fieldLabel = translateLabel({ resource, source: sort?.field });
  const fieldLowerFirst =
    typeof fieldLabel === "string" && fieldLabel
      ? fieldLabel.charAt(0).toLowerCase() + fieldLabel.slice(1)
      : sort?.field ?? "";
  const sortButtonLabel = translate("ra.sort.sort_by", {
    field: fieldLabel,
    field_lower_first: fieldLowerFirst,
    order: translate(`ra.sort.${sort?.order ?? "ASC"}`),
    _: "Sort by",
  });

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2 h-8 border-b border-[var(--twenty-border-light)]",
        "bg-background text-muted-foreground text-xs",
        className
      )}
    >
      <div className="flex items-center gap-1">
      {sortFields.length > 0 && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TableToolbarOption
                icon={<HugeiconsIcon icon={ArrowUpDownIcon} />}
                type="button"
              >
                {sortButtonLabel}
              </TableToolbarOption>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {sortFields.map((field) => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => handleSort(field)}
                  className={cn(sort.field === field && "bg-accent")}
                >
                  {translateLabel({ resource, source: field })}{" "}
                  {sort.field === field && (
                    <span className="ml-1 text-xs opacity-70">
                      ({translate(`ra.sort.${sort.order}`)})
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="h-4 w-px bg-border" />
        </>
      )}
      <FilterButton
        variant="ghost"
        minimal={false}
        size="sm"
        className={tableToolbarOptionClasses}
      />
      </div>
      {toolbarActions && (
        <div className="flex items-center gap-2 shrink-0">
          {toolbarActions}
        </div>
      )}
    </div>
  );
}

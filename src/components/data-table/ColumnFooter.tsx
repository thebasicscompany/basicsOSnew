import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown } from "lucide-react";

export interface ColumnFooterProps {
  attribute: Attribute;
  values: any[];
  activeCalculation?: string;
  onSelectCalculation: (calcType: string) => void;
}

export function ColumnFooter({
  attribute,
  values,
  activeCalculation,
  onSelectCalculation,
}: ColumnFooterProps) {
  const fieldType = getFieldType(attribute.uiType);
  const availableCalcs = fieldType.availableCalculations;

  // Compute the result if there's an active calculation
  const result = React.useMemo(() => {
    if (!activeCalculation) return null;
    return fieldType.calculate(activeCalculation, values);
  }, [activeCalculation, values, fieldType]);

  if (availableCalcs.length === 0) {
    return <div className="h-full" />;
  }

  if (activeCalculation && result !== null) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors h-full px-2 w-full text-left">
            <span className="font-medium text-foreground">{result}</span>
            <span className="truncate">
              {formatCalcLabel(activeCalculation)}
            </span>
            <ChevronDown className="size-3 ml-auto shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {availableCalcs.map((calc) => (
            <DropdownMenuItem
              key={calc}
              onClick={() => onSelectCalculation(calc)}
              className={cn(
                "text-xs",
                calc === activeCalculation && "bg-accent",
              )}
            >
              {formatCalcLabel(calc)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() => onSelectCalculation("")}
            className="text-xs text-muted-foreground"
          >
            Remove calculation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover/footer:opacity-100 h-full px-2">
          <Calculator className="size-3" />
          <span>Calculate</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {availableCalcs.map((calc) => (
          <DropdownMenuItem
            key={calc}
            onClick={() => onSelectCalculation(calc)}
            className="text-xs"
          >
            {formatCalcLabel(calc)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Human-readable label for a calculation type */
function formatCalcLabel(calcType: string): string {
  const labels: Record<string, string> = {
    count: "Count",
    countEmpty: "Count empty",
    countFilled: "Count filled",
    countUnique: "Count unique",
    sum: "Sum",
    average: "Average",
    min: "Min",
    max: "Max",
    median: "Median",
    range: "Range",
    percentEmpty: "% empty",
    percentFilled: "% filled",
  };
  return labels[calcType] ?? calcType;
}

// ---------------------------------------------------------------------------
// Aggregate Footer Row — renders a footer cell for each column
// ---------------------------------------------------------------------------

export interface ColumnFooterRowProps {
  attributes: Attribute[];
  data: Record<string, any>[];
  total: number;
  calculations: Record<string, string>; // fieldId -> calcType
  onSelectCalculation: (fieldId: string, calcType: string) => void;
  /** Number of leading utility columns (select + row number) */
  leadingColumns?: number;
}

export function ColumnFooterRow({
  attributes,
  data,
  total,
  calculations,
  onSelectCalculation,
  leadingColumns = 2,
}: ColumnFooterRowProps) {
  return (
    <tr className="group/footer h-8 border-t bg-muted/30">
      {/* Leading columns: show total count in first available cell */}
      {Array.from({ length: leadingColumns }).map((_, i) => (
        <td
          key={`lead-${i}`}
          className="h-8 px-2 text-xs text-muted-foreground whitespace-nowrap border-r border-b border-[var(--twenty-border-light)]"
        >
          {i === 0 && <span className="font-medium">{total} count</span>}
        </td>
      ))}

      {/* Attribute columns */}
      {attributes.map((attr) => {
        const values = data.map((row) => row[attr.columnName]);
        const activeCalc = calculations[attr.id] || undefined;

        return (
          <td
            key={attr.id}
            className="h-8 whitespace-nowrap border-r border-b border-[var(--twenty-border-light)]"
          >
            <ColumnFooter
              attribute={attr}
              values={values}
              activeCalculation={activeCalc}
              onSelectCalculation={(calcType) =>
                onSelectCalculation(attr.id, calcType)
              }
            />
          </td>
        );
      })}

      {/* Trailing add-column cell */}
      <td className="h-8 border-r border-b border-[var(--twenty-border-light)]" />
    </tr>
  );
}

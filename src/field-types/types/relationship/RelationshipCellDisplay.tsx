import { ArrowSquareUpRightIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "@/field-types/types";
interface LinkedRecord {
  id: string;
  title?: string;
  tableName?: string;
}

function parseRelationshipValue(value: any): LinkedRecord[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === "object" && v.id) return v as LinkedRecord;
      return { id: String(v), title: String(v) };
    });
  }
  if (typeof value === "object" && value.id) return [value as LinkedRecord];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.id) return [parsed as LinkedRecord];
    } catch {
      return [{ id: value, title: value }];
    }
  }
  return [];
}

export function RelationshipCellDisplay({ value }: CellDisplayProps) {
  const records = parseRelationshipValue(value);

  if (records.length === 0) {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {records.map((record, i) => (
        <span
          key={`${record.id}-${i}`}
          className="bg-muted inline-flex shrink-0 items-center gap-0.5 truncate rounded px-1.5 py-0.5 text-xs font-medium"
        >
          {record.title || record.id}
          <ArrowSquareUpRightIcon className="h-3 w-3 opacity-50" />
        </span>
      ))}
    </div>
  );
}

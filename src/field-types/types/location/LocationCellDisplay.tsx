import { MapPinIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "../../types";
interface LocationValue {
  city?: string;
  state?: string;
  country?: string;
}

function formatLocation(loc: LocationValue): string {
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(", ");
}

function parseLocationValue(value: any): LocationValue | null {
  if (value == null || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value))
    return value as LocationValue;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as LocationValue;
    } catch {
      // Try to parse "City, State, Country" format
      const parts = value.split(",").map((s: string) => s.trim());
      return {
        city: parts[0] || undefined,
        state: parts[1] || undefined,
        country: parts[2] || undefined,
      };
    }
  }
  return null;
}

export function LocationCellDisplay({ value }: CellDisplayProps) {
  const loc = parseLocationValue(value);

  if (!loc || formatLocation(loc) === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <span className="inline-flex items-center gap-1 truncate text-sm">
      <MapPinIcon className="text-muted-foreground h-3 w-3 shrink-0" />
      {formatLocation(loc)}
    </span>
  );
}

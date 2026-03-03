import { useState, useRef, useEffect } from "react";
import type { CellEditorProps } from "../../types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface LocationValue {
  city?: string;
  state?: string;
  country?: string;
}

function parseLocationValue(value: any): LocationValue {
  if (value == null || value === "")
    return { city: "", state: "", country: "" };
  if (typeof value === "object" && !Array.isArray(value))
    return value as LocationValue;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as LocationValue;
    } catch {
      const parts = value.split(",").map((s: string) => s.trim());
      return {
        city: parts[0] || "",
        state: parts[1] || "",
        country: parts[2] || "",
      };
    }
  }
  return { city: "", state: "", country: "" };
}

export function LocationCellEditor({
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const parsed = parseLocationValue(value);
  const [city, setCity] = useState(parsed.city ?? "");
  const [state, setState] = useState(parsed.state ?? "");
  const [country, setCountry] = useState(parsed.country ?? "");
  const cityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => cityRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    const isEmpty = !city && !state && !country;
    onSave(
      isEmpty
        ? null
        : {
            city: city || undefined,
            state: state || undefined,
            country: country || undefined,
          },
    );
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSave();
        setOpen(o);
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-64 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">
              City
            </label>
            <Input
              ref={cityRef}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">
              State / Region
            </label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">
              Country
            </label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex justify-end gap-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCancel();
              }}
              className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
            >
              Save
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

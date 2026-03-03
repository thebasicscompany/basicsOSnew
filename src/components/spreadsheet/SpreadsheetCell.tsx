import { useCallback, useRef, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSelectPillClasses, getSelectColor } from "./select-colors";

export interface SpreadsheetCellProps {
  value: unknown;
  uidt: string;
  isEditing: boolean;
  isSelected: boolean;
  readOnly?: boolean;
  isPrimary?: boolean;
  dtxp?: string; // comma-separated options for select types
  onStartEdit: () => void;
  onSelect: () => void;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}

export function SpreadsheetCell({
  value,
  uidt,
  isEditing,
  isSelected,
  readOnly,
  isPrimary,
  dtxp,
  onStartEdit,
  onSelect,
  onCommit,
  onCancel,
}: SpreadsheetCellProps) {
  const handleClick = useCallback(() => {
    if (!isSelected) {
      onSelect();
    }
  }, [isSelected, onSelect]);

  const handleDoubleClick = useCallback(() => {
    if (!readOnly) {
      onStartEdit();
    }
  }, [readOnly, onStartEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSelected && !isEditing && !readOnly) {
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          onStartEdit();
        }
      }
    },
    [isSelected, isEditing, readOnly, onStartEdit],
  );

  // Checkbox is toggled on click, no edit mode needed
  if (uidt === "Checkbox") {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center px-2",
          isSelected && "ring-2 ring-inset ring-blue-500",
        )}
        onClick={handleClick}
      >
        <Checkbox
          checked={!!value}
          disabled={readOnly}
          onCheckedChange={(checked) => {
            if (!readOnly) onCommit(!!checked);
          }}
        />
      </div>
    );
  }

  // Rating is toggled on click
  if (uidt === "Rating") {
    const max = dtxp ? parseInt(dtxp, 10) || 5 : 5;
    const current = typeof value === "number" ? value : Number(value) || 0;
    return (
      <div
        className={cn(
          "flex h-full items-center gap-0.5 px-2",
          isSelected && "ring-2 ring-inset ring-blue-500",
        )}
        onClick={handleClick}
      >
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            className="text-amber-400 hover:scale-110 disabled:pointer-events-none"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onCommit(i + 1 === current ? 0 : i + 1);
            }}
          >
            <Star
              className={cn(
                "size-3.5",
                i < current ? "fill-amber-400" : "fill-none",
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  if (isEditing) {
    return (
      <CellEditor
        value={value}
        uidt={uidt}
        dtxp={dtxp}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-[32px] cursor-default items-center truncate px-2 text-sm",
        isSelected && "ring-2 ring-inset ring-blue-500",
        !readOnly && "cursor-cell",
        isPrimary && "font-medium text-blue-600",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelected ? 0 : -1}
    >
      <CellDisplay value={value} uidt={uidt} isPrimary={isPrimary} />
    </div>
  );
}

/** Read-only display of a cell value, dispatched by column type. */
function CellDisplay({
  value,
  uidt,
  isPrimary,
}: {
  value: unknown;
  uidt: string;
  isPrimary?: boolean;
}) {
  if (value == null || value === "") {
    return (
      <span className="italic text-muted-foreground/40">&mdash;</span>
    );
  }

  // Handle JSON/object values
  if (uidt === "JSON" || (typeof value === "object" && value !== null && !Array.isArray(value))) {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      return (
        <span className="truncate font-mono text-xs text-muted-foreground">
          {str}
        </span>
      );
    } catch {
      return <span className="italic text-muted-foreground/40">&mdash;</span>;
    }
  }

  switch (uidt) {
    case "Email":
      return (
        <a
          href={`mailto:${String(value)}`}
          className="truncate text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      );

    case "URL":
      return (
        <a
          href={
            String(value).startsWith("http")
              ? String(value)
              : `https://${String(value)}`
          }
          target="_blank"
          rel="noreferrer"
          className="truncate text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      );

    case "Number":
    case "Decimal":
      return (
        <span className="ml-auto tabular-nums">{String(value)}</span>
      );

    case "Currency":
      try {
        const num = Number(value);
        return (
          <span className="ml-auto tabular-nums">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(num)}
          </span>
        );
      } catch {
        return <span className="ml-auto tabular-nums">{String(value)}</span>;
      }

    case "Percent":
      return (
        <span className="ml-auto tabular-nums">{String(value)}%</span>
      );

    case "Duration":
      return <span className="ml-auto tabular-nums">{String(value)}</span>;

    case "Rating": {
      const max = 5;
      const current = typeof value === "number" ? value : Number(value) || 0;
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: max }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5 text-amber-400",
                i < current ? "fill-amber-400" : "fill-none",
              )}
            />
          ))}
        </div>
      );
    }

    case "Date":
    case "DateTime":
    case "CreatedTime":
    case "LastModifiedTime":
      try {
        const d = new Date(String(value));
        return (
          <span>
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(d)}
          </span>
        );
      } catch {
        return <span>{String(value)}</span>;
      }

    case "SingleSelect":
      return (
        <span className={getSelectPillClasses(String(value))}>
          {String(value)}
        </span>
      );

    case "MultiSelect": {
      const items = Array.isArray(value)
        ? value
        : String(value)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => (
            <span key={i} className={getSelectPillClasses(String(item))}>
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    case "Checkbox":
      return <Checkbox checked={!!value} disabled />;

    case "LongText":
      return (
        <span className="line-clamp-2 whitespace-pre-wrap">
          {String(value)}
        </span>
      );

    default:
      return <span className={cn(isPrimary && "font-medium")}>{String(value)}</span>;
  }
}

/** Inline editor for a cell, dispatched by column type. */
function CellEditor({
  value,
  uidt,
  dtxp,
  onCommit,
  onCancel,
}: {
  value: unknown;
  uidt: string;
  dtxp?: string;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}) {
  const strValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(strValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      if ("select" in el) el.select();
    }
  }, []);

  const commit = useCallback(() => {
    let parsed: unknown = draft;
    if (
      uidt === "Number" ||
      uidt === "Decimal" ||
      uidt === "Currency" ||
      uidt === "Percent"
    ) {
      const num = Number(draft);
      parsed = isNaN(num) ? null : num;
    }
    onCommit(parsed);
  }, [draft, uidt, onCommit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commit();
      }
    },
    [commit, onCancel],
  );

  // Date picker using shadcn Calendar
  if (uidt === "Date" || uidt === "DateTime") {
    const dateVal = strValue ? new Date(strValue) : undefined;
    return (
      <div className="ring-2 ring-inset ring-primary">
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button
              className="flex h-full w-full items-center px-2 text-sm"
              type="button"
            >
              {dateVal
                ? new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(dateVal)
                : "Pick a date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateVal}
              onSelect={(d) => {
                if (d) {
                  onCommit(d.toISOString().slice(0, 10));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // SingleSelect with colored options
  if (uidt === "SingleSelect" && dtxp) {
    const options = dtxp.split(",").map((s) => s.trim()).filter(Boolean);
    return (
      <div className="ring-2 ring-inset ring-primary">
        <Select
          defaultOpen
          value={strValue}
          onValueChange={(v) => onCommit(v)}
        >
          <SelectTrigger className="h-full w-full border-0 text-sm shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => {
              const colors = getSelectColor(opt);
              return (
                <SelectItem key={opt} value={opt}>
                  <span
                    className={`${colors.bg} ${colors.text} rounded-full px-2 py-0.5 text-xs font-medium`}
                  >
                    {opt}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // MultiSelect with checkboxes
  if (uidt === "MultiSelect" && dtxp) {
    const options = dtxp.split(",").map((s) => s.trim()).filter(Boolean);
    const selected = new Set(
      Array.isArray(value)
        ? (value as string[])
        : strValue
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    );

    return (
      <div className="ring-2 ring-inset ring-primary">
        <Popover defaultOpen>
          <PopoverTrigger asChild>
            <button
              className="flex h-full w-full flex-wrap items-center gap-1 px-2 text-sm"
              type="button"
            >
              {[...selected].map((v) => (
                <span key={v} className={getSelectPillClasses(v)}>
                  {v}
                </span>
              ))}
              {selected.size === 0 && (
                <span className="text-muted-foreground">Select...</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {options.map((opt) => {
              const isSelected = selected.has(opt);
              const colors = getSelectColor(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    const next = new Set(selected);
                    if (isSelected) next.delete(opt);
                    else next.add(opt);
                    onCommit([...next].join(","));
                  }}
                >
                  <div
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </div>
                  <span
                    className={`${colors.bg} ${colors.text} rounded-full px-2 py-0.5 text-xs font-medium`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (uidt === "LongText") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        className="h-full w-full resize-none border-0 bg-background px-2 py-1 text-sm outline-none ring-2 ring-inset ring-primary"
        rows={3}
      />
    );
  }

  const isNumber =
    uidt === "Number" ||
    uidt === "Decimal" ||
    uidt === "Currency" ||
    uidt === "Percent";

  const inputType = isNumber
    ? "number"
    : uidt === "Email"
      ? "email"
      : uidt === "URL"
        ? "url"
        : "text";

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={inputType}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
      className={cn(
        "h-full w-full border-0 bg-background px-2 text-sm outline-none ring-2 ring-inset ring-primary",
        isNumber && "text-right tabular-nums",
      )}
    />
  );
}

/**
 * Full-width field editor for the expanded form (not inline).
 * Re-uses the same type dispatch but with full-width styling.
 */
export function ExpandedFieldEditor({
  value,
  uidt,
  readOnly,
  dtxp,
  onUpdate,
}: {
  value: unknown;
  uidt: string;
  readOnly: boolean;
  dtxp?: string;
  onUpdate: (value: unknown) => void;
}) {
  const strValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(strValue);
  const [editing, setEditing] = useState(false);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (draft !== strValue) {
      let parsed: unknown = draft;
      if (
        uidt === "Number" ||
        uidt === "Decimal" ||
        uidt === "Currency" ||
        uidt === "Percent"
      ) {
        const num = Number(draft);
        parsed = isNaN(num) ? null : num;
      }
      onUpdate(parsed);
    }
  }, [draft, strValue, uidt, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      } else if (e.key === "Escape") {
        setDraft(strValue);
        setEditing(false);
      }
    },
    [strValue],
  );

  if (uidt === "Checkbox") {
    return (
      <div className="flex items-center pt-1.5">
        <Checkbox
          checked={!!value}
          disabled={readOnly}
          onCheckedChange={(checked) => {
            if (!readOnly) onUpdate(!!checked);
          }}
        />
      </div>
    );
  }

  if (uidt === "Rating") {
    const max = dtxp ? parseInt(dtxp, 10) || 5 : 5;
    const current = typeof value === "number" ? value : Number(value) || 0;
    return (
      <div className="flex items-center gap-1 pt-1">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            className="text-amber-400 hover:scale-110 disabled:pointer-events-none"
            disabled={readOnly}
            onClick={() => onUpdate(i + 1 === current ? 0 : i + 1)}
          >
            <Star
              className={cn(
                "size-5",
                i < current ? "fill-amber-400" : "fill-none",
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  // Date picker
  if (uidt === "Date" || uidt === "DateTime") {
    const dateVal = strValue ? new Date(strValue) : undefined;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex h-8 w-full items-center rounded-md border border-input px-3 text-sm",
              readOnly && "cursor-default opacity-70",
              !strValue && "text-muted-foreground",
            )}
            disabled={readOnly}
            type="button"
          >
            {dateVal
              ? new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(dateVal)
              : "Pick a date"}
          </button>
        </PopoverTrigger>
        {!readOnly && (
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateVal}
              onSelect={(d) => {
                if (d) onUpdate(d.toISOString().slice(0, 10));
              }}
              initialFocus
            />
          </PopoverContent>
        )}
      </Popover>
    );
  }

  // SingleSelect
  if (uidt === "SingleSelect" && dtxp) {
    const options = dtxp.split(",").map((s) => s.trim()).filter(Boolean);
    return (
      <Select
        value={strValue}
        onValueChange={(v) => onUpdate(v)}
        disabled={readOnly}
      >
        <SelectTrigger className="h-8 w-full text-sm">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => {
            const colors = getSelectColor(opt);
            return (
              <SelectItem key={opt} value={opt}>
                <span
                  className={`${colors.bg} ${colors.text} rounded-full px-2 py-0.5 text-xs font-medium`}
                >
                  {opt}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  // MultiSelect
  if (uidt === "MultiSelect" && dtxp) {
    const options = dtxp.split(",").map((s) => s.trim()).filter(Boolean);
    const selected = new Set(
      Array.isArray(value)
        ? (value as string[])
        : strValue
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    );
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex min-h-[32px] w-full flex-wrap items-center gap-1 rounded-md border border-input px-3 py-1 text-sm",
              readOnly && "cursor-default opacity-70",
            )}
            disabled={readOnly}
            type="button"
          >
            {[...selected].map((v) => (
              <span key={v} className={getSelectPillClasses(v)}>
                {v}
              </span>
            ))}
            {selected.size === 0 && (
              <span className="text-muted-foreground">Select...</span>
            )}
          </button>
        </PopoverTrigger>
        {!readOnly && (
          <PopoverContent className="w-48 p-1" align="start">
            {options.map((opt) => {
              const isChecked = selected.has(opt);
              const colors = getSelectColor(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    const next = new Set(selected);
                    if (isChecked) next.delete(opt);
                    else next.add(opt);
                    onUpdate([...next].join(","));
                  }}
                >
                  <div
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      isChecked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {isChecked && <Check className="size-3" />}
                  </div>
                  <span
                    className={`${colors.bg} ${colors.text} rounded-full px-2 py-0.5 text-xs font-medium`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </PopoverContent>
        )}
      </Popover>
    );
  }

  if (uidt === "LongText") {
    return (
      <textarea
        value={editing ? draft : strValue}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => {
          setDraft(strValue);
          setEditing(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={readOnly}
        rows={3}
        className="w-full resize-none rounded-md border border-input px-3 py-2 text-sm disabled:cursor-default disabled:opacity-70"
        placeholder="Empty"
      />
    );
  }

  const isNumber =
    uidt === "Number" ||
    uidt === "Decimal" ||
    uidt === "Currency" ||
    uidt === "Percent";

  const inputType = isNumber
    ? "number"
    : uidt === "Email"
      ? "email"
      : uidt === "URL"
        ? "url"
        : "text";

  return (
    <input
      type={inputType}
      value={editing ? draft : strValue}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => {
        setDraft(strValue);
        setEditing(true);
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={readOnly}
      className={cn(
        "h-8 w-full rounded-md border border-input px-3 text-sm disabled:cursor-default disabled:opacity-70",
        isNumber && "text-right tabular-nums",
      )}
      placeholder="Empty"
    />
  );
}

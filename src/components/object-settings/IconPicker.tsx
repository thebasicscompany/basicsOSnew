import { useState, useMemo } from "react";
import * as icons from "lucide-react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Pre-computed list of common / CRM-relevant Lucide icon names.
 * Kept short for fast initial rendering; full search still works
 * against all Lucide exports.
 */
const COMMON_ICONS = [
  "building",
  "building-2",
  "users",
  "user",
  "handshake",
  "briefcase",
  "mail",
  "phone",
  "globe",
  "map-pin",
  "calendar",
  "clock",
  "star",
  "heart",
  "flag",
  "tag",
  "folder",
  "file",
  "link",
  "dollar-sign",
  "credit-card",
  "shopping-cart",
  "truck",
  "package",
  "shield",
  "lock",
  "key",
  "settings",
  "tool",
  "zap",
  "activity",
  "archive",
  "award",
  "bar-chart",
  "bell",
  "bookmark",
  "box",
  "camera",
  "check-circle",
  "clipboard",
  "code",
  "coffee",
  "compass",
  "cpu",
  "database",
  "download",
  "edit",
  "eye",
  "feather",
  "filter",
  "gift",
  "grid",
  "hard-drive",
  "hash",
  "headphones",
  "home",
  "image",
  "inbox",
  "info",
  "layers",
  "layout",
  "life-buoy",
  "list",
  "log-in",
  "map",
  "message-circle",
  "message-square",
  "mic",
  "monitor",
  "navigation",
  "paperclip",
  "pen-tool",
  "pie-chart",
  "play",
  "plus-circle",
  "pocket",
  "power",
  "printer",
  "radio",
  "refresh-cw",
  "repeat",
  "rocket",
  "save",
  "search",
  "send",
  "server",
  "share",
  "shopping-bag",
  "smile",
  "speaker",
  "square",
  "target",
  "terminal",
  "thumbs-up",
  "trash",
  "trending-up",
  "type",
  "umbrella",
  "upload",
  "video",
  "wifi",
  "x-circle",
] as const;

/**
 * Convert a kebab-case icon name to the PascalCase export name Lucide uses,
 * e.g. "map-pin" -> "MapPin" (the export is actually "MapPinIcon" in some builds,
 * but standard lucide-react uses PascalCase without "Icon" suffix for the component).
 *
 * Lucide React exports follow the pattern: kebab "arrow-right" -> "ArrowRight".
 */
function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/**
 * Resolve a kebab-case icon name to a Lucide icon component.
 */
function resolveIcon(name: string): icons.LucideIcon | null {
  const pascal = kebabToPascal(name);
  const icon = (icons as Record<string, unknown>)[pascal];
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
  ) {
    return icon as icons.LucideIcon;
  }
  return null;
}

/**
 * Build a searchable list of icon entries from the COMMON_ICONS list,
 * falling back to scanning all lucide exports when the user searches.
 */
function getAllLucideIconNames(): string[] {
  const names: string[] = [];
  for (const key of Object.keys(icons)) {
    // lucide-react also exports helpers and types; icons are PascalCase components
    if (
      key[0] >= "A" &&
      key[0] <= "Z" &&
      typeof (icons as Record<string, unknown>)[key] === "object"
    ) {
      // Convert PascalCase back to kebab for display
      const kebab = key
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .slice(1);
      names.push(kebab);
    }
  }
  return names;
}

// Lazily computed full icon list
let _allNames: string[] | null = null;
function allIconNames() {
  if (!_allNames) _allNames = getAllLucideIconNames();
  return _allNames;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  label = "Icon",
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const matchedIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      // Show common icons when no search
      return COMMON_ICONS.slice(0, 30).map((name) => ({
        name,
        Icon: resolveIcon(name),
      }));
    }
    // Search all icons
    const all = allIconNames();
    return all
      .filter((n) => n.includes(query))
      .slice(0, 30)
      .map((name) => ({
        name,
        Icon: resolveIcon(name),
      }));
  }, [search]);

  const SelectedIcon = resolveIcon(value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 font-normal"
          >
            {SelectedIcon ? (
              <SelectedIcon className="size-4" />
            ) : (
              <icons.HelpCircle className="size-4 text-muted-foreground" />
            )}
            <span className="truncate text-sm">
              {value || "Choose an icon..."}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-52">
            <div className="grid grid-cols-6 gap-1 p-2">
              {matchedIcons.map(({ name, Icon }) =>
                Icon ? (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    className={cn(
                      "flex items-center justify-center size-9 rounded-md transition-colors hover:bg-accent",
                      value === name &&
                        "bg-primary/10 text-primary ring-1 ring-primary/30",
                    )}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Icon className="size-4" />
                  </button>
                ) : null,
              )}
              {matchedIcons.length === 0 && (
                <p className="col-span-6 py-6 text-center text-sm text-muted-foreground">
                  No icons found
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

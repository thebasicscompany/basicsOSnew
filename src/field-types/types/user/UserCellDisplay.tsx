import type { CellDisplayProps } from "@/field-types/types";
import { cn } from "@/lib/utils";

interface UserValue {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

function parseUserValue(value: any): UserValue | null {
  if (value == null || value === "") return null;
  if (typeof value === "object" && value.id) return value as UserValue;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed.id) return parsed as UserValue;
    } catch {
      // treat as user name/id
      return { id: value, name: value };
    }
  }
  return null;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function hashToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function UserCellDisplay({ value }: CellDisplayProps) {
  const user = parseUserValue(value);

  if (!user) {
    return <span className="text-muted-foreground text-sm" />;
  }

  const displayName = user.name || user.email || user.id;
  const initials = getInitials(displayName);
  const bgColor = hashToColor(user.id);

  return (
    <span className="inline-flex items-center gap-1.5 truncate text-sm">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={displayName}
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white",
            bgColor,
          )}
        >
          {initials}
        </span>
      )}
      <span className="truncate">{displayName}</span>
    </span>
  );
}

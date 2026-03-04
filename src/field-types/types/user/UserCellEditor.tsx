import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { CellEditorProps } from "@/field-types/types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
interface UserOption {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
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

export function UserCellEditor({
  value,
  config,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const users: UserOption[] = config.users ?? [];

  const currentId =
    typeof value === "object" && value?.id
      ? value.id
      : typeof value === "string"
        ? value
        : null;

  const handleSelect = (user: UserOption) => {
    if (user.id === currentId) {
      onSave(null);
    } else {
      onSave(user);
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
        setOpen(o);
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-56 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            {users.map((user) => {
              const displayName = user.name || user.email || user.id;
              const initials = getInitials(displayName);
              const bgColor = hashToColor(user.id);
              const isSelected = user.id === currentId;

              return (
                <CommandItem
                  key={user.id}
                  value={displayName}
                  onSelect={() => handleSelect(user)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white",
                          bgColor,
                        )}
                      >
                        {initials}
                      </span>
                    )}
                    <span className="text-sm">{displayName}</span>
                  </span>
                  {isSelected && (
                    <CheckIcon className="text-primary ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

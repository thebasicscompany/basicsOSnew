import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, ArrowDown, EyeOff } from "lucide-react";

interface ColumnHeaderMenuProps {
  children: React.ReactNode;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onHide: () => void;
}

export function ColumnHeaderMenu({
  children,
  onSortAsc,
  onSortDesc,
  onHide,
}: ColumnHeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={onSortAsc} className="gap-2 text-xs">
          <ArrowUp className="size-3.5" />
          Sort ascending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSortDesc} className="gap-2 text-xs">
          <ArrowDown className="size-3.5" />
          Sort descending
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHide} className="gap-2 text-xs">
          <EyeOff className="size-3.5" />
          Hide column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

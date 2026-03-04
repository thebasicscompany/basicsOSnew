import {
  BuildingsIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const IMPORTABLE_OBJECTS = [
  { slug: "contacts", label: "Contacts", icon: UsersIcon },
  { slug: "companies", label: "Companies", icon: BuildingsIcon },
  { slug: "deals", label: "Deals", icon: CurrencyDollarIcon },
] as const;

export interface ImportObjectSelectorProps {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}

export function ImportObjectSelector({
  value,
  onChange,
  disabled,
}: ImportObjectSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Import into</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {IMPORTABLE_OBJECTS.map(({ slug, label, icon: Icon }) => (
            <SelectItem key={slug} value={slug}>
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

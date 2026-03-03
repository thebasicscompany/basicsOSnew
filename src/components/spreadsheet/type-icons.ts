import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  CheckSquare,
  Mail,
  Link,
  List,
  Percent,
  Clock,
  Star,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

const UIDT_ICON_MAP: Record<string, LucideIcon> = {
  SingleLineText: Type,
  LongText: AlignLeft,
  Number: Hash,
  Decimal: Hash,
  Currency: DollarSign,
  Percent: Percent,
  Duration: Clock,
  Rating: Star,
  Date: Calendar,
  DateTime: Calendar,
  CreatedTime: Clock,
  LastModifiedTime: Clock,
  Checkbox: CheckSquare,
  Email: Mail,
  URL: Link,
  SingleSelect: List,
  MultiSelect: List,
};

export function getTypeIcon(uidt?: string): LucideIcon | undefined {
  if (!uidt) return undefined;
  return UIDT_ICON_MAP[uidt];
}

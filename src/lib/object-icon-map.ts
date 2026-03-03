/**
 * Maps ObjectConfig.icon slug strings to Phosphor icon components.
 *
 * Since icon imports are tree-shakeable, we maintain an explicit map.
 * Add new entries here when seeding new object types.
 */
import {
  BuildingIcon,
  UserIcon,
  HandshakeIcon,
  BriefcaseIcon,
  ListChecksIcon,
  UsersIcon,
  ReceiptIcon,
  CalendarIcon,
  ShoppingBagIcon,
  PaperclipIcon,
  NotebookIcon,
} from "@phosphor-icons/react";

/** Phosphor icon component type */
type PhosphorIcon = typeof BuildingIcon;

const ICON_MAP: Record<string, PhosphorIcon> = {
  "building-2": BuildingIcon,
  users: UsersIcon,
  user: UserIcon,
  handshake: HandshakeIcon,
  briefcase: BriefcaseIcon,
  checklist: ListChecksIcon,
  invoice: ReceiptIcon,
  calendar: CalendarIcon,
  "shopping-bag": ShoppingBagIcon,
  attachment: PaperclipIcon,
  notebook: NotebookIcon,
  // Add more mappings as new object types are seeded
};

/** Default fallback icon when the slug has no mapping. */
const FALLBACK_ICON = BuildingIcon;

/**
 * Resolve an icon slug (from ObjectConfig.icon) to a Phosphor icon component.
 * Returns a fallback icon when no mapping exists.
 */
export function getObjectIcon(slug: string): PhosphorIcon {
  return ICON_MAP[slug] ?? FALLBACK_ICON;
}

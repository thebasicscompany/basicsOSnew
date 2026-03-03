/**
 * Maps ObjectConfig.icon slug strings to HugeIcons icon components.
 *
 * Since icon imports are tree-shakeable, we maintain an explicit map.
 * Add new entries here when seeding new object types.
 */
import {
  Building02Icon,
  UserIcon,
  Agreement01Icon,
  Briefcase01Icon,
  CheckListIcon,
  UserMultipleIcon,
  Invoice01Icon,
  Calendar01Icon,
  ShoppingBag01Icon,
  FileAttachmentIcon,
  Notebook01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Icon type from hugeicons — all icon constants share the same shape.
 */
type HugeIcon = typeof Building02Icon;

const ICON_MAP: Record<string, HugeIcon> = {
  "building-2": Building02Icon,
  users: UserMultipleIcon,
  user: UserIcon,
  handshake: Agreement01Icon,
  briefcase: Briefcase01Icon,
  checklist: CheckListIcon,
  invoice: Invoice01Icon,
  calendar: Calendar01Icon,
  "shopping-bag": ShoppingBag01Icon,
  attachment: FileAttachmentIcon,
  notebook: Notebook01Icon,
  // Add more mappings as new object types are seeded
};

/** Default fallback icon when the slug has no mapping. */
const FALLBACK_ICON = Building02Icon;

/**
 * Resolve an icon slug (from ObjectConfig.icon) to a HugeIcons component.
 * Returns a fallback icon when no mapping exists.
 */
export function getObjectIcon(slug: string): HugeIcon {
  return ICON_MAP[slug] ?? FALLBACK_ICON;
}

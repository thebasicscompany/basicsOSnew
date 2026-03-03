/**
 * NocoDB-style 10-color palette for select options.
 * Each color maps to Tailwind bg/text/border classes.
 */

export interface SelectColorClasses {
  bg: string;
  text: string;
  border: string;
}

const PALETTE: { name: string; classes: SelectColorClasses }[] = [
  { name: "blue", classes: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" } },
  { name: "cyan", classes: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200" } },
  { name: "teal", classes: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" } },
  { name: "green", classes: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" } },
  { name: "yellow", classes: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" } },
  { name: "orange", classes: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" } },
  { name: "pink", classes: { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" } },
  { name: "red", classes: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" } },
  { name: "purple", classes: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" } },
  { name: "indigo", classes: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" } },
];

/** Simple string hash for deterministic color assignment */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Get deterministic color classes for a select option value */
export function getSelectColor(value: string): SelectColorClasses {
  const idx = hashString(value) % PALETTE.length;
  return PALETTE[idx].classes;
}

/** Render a colored pill className string */
export function getSelectPillClasses(value: string): string {
  const c = getSelectColor(value);
  return `${c.bg} ${c.text} ${c.border} rounded-full border px-2 py-0.5 text-xs font-medium`;
}

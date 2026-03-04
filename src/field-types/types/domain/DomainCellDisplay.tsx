import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "../../types";
function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function displayDomain(url: string): string {
  try {
    const parsed = new URL(ensureProtocol(url));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function DomainCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  const href = ensureProtocol(String(value));
  const display = displayDomain(String(value));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
      onClick={(e) => e.stopPropagation()}
      title={String(value)}
    >
      {display}
      <ArrowSquareOutIcon className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}

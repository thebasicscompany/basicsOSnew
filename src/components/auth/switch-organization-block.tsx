"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyServerUrlFromUi } from "@/lib/apply-server-url";
import { cn } from "@/lib/utils";

type SwitchOrganizationBlockProps = {
  className?: string;
  /** Tighter spacing for sign-in / sign-up cards */
  compact?: boolean;
  /** Omit outer card border (e.g. when nested in another card) */
  unstyled?: boolean;
  /** Hide built-in title and description (parent supplies heading copy) */
  hideHeading?: boolean;
  /** Initial error (e.g. server unreachable on load) */
  initialError?: string | null;
  /**
   * `subtle` — collapsed disclosure on auth screens (low-key).
   * `default` — bordered card (settings-style).
   */
  variant?: "default" | "subtle";
};

export function SwitchOrganizationBlock({
  className,
  compact,
  unstyled,
  hideHeading,
  initialError = null,
  variant = "default",
}: SwitchOrganizationBlockProps) {
  const baseId = useId();
  const inputId = `${baseId}-server-link`;
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  const [disclosureOpen, setDisclosureOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await applyServerUrlFromUi(url);
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const formFields = (
    <>
      {!hideHeading && variant !== "subtle" ? (
        <div className="space-y-1">
          <h2
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-sm" : "text-[15px]",
            )}
          >
            Switch organization
          </h2>
          <p className="text-xs text-muted-foreground">
            Use your organization&apos;s server link to connect to a different
            backend. You will be signed out and asked to sign in again.
          </p>
        </div>
      ) : null}
      {!hideHeading && variant === "subtle" ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Paste your organization&apos;s server link. You&apos;ll be signed out
          and can sign in again on that backend.
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">
          Server link
        </Label>
        <Input
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://api.example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            disabled={busy}
            className={cn(
              "font-mono text-sm",
              variant === "subtle" && "h-9",
            )}
          />
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant={variant === "subtle" ? "outline" : "secondary"}
        size="sm"
        className="w-full"
        disabled={busy || !url.trim()}
      >
        {busy ? "Switching…" : "Switch organization"}
      </Button>
    </>
  );

  if (variant === "subtle") {
    return (
      <Collapsible
        open={disclosureOpen}
        onOpenChange={setDisclosureOpen}
        className={cn("w-full", className)}
      >
        <div className="mt-6 border-t border-border/40 pt-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <CaretRightIcon
                className={cn(
                  "size-3 shrink-0 transition-transform duration-200",
                  disclosureOpen && "rotate-90",
                )}
                aria-hidden
              />
              <span>Switch organization</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="outline-none">
            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              {formFields}
            </form>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div
      className={cn(
        !unstyled && "rounded-lg border bg-muted/20 p-4",
        !unstyled && compact && "p-3",
        className,
      )}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        {formFields}
      </form>
    </div>
  );
}

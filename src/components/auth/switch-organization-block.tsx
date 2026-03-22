"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
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
};

export function SwitchOrganizationBlock({
  className,
  compact,
  unstyled,
  hideHeading,
  initialError = null,
}: SwitchOrganizationBlockProps) {
  const baseId = useId();
  const inputId = `${baseId}-server-link`;
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div
      className={cn(
        !unstyled && "rounded-lg border bg-muted/20 p-4",
        !unstyled && compact && "p-3",
        className,
      )}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        {!hideHeading ? (
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
        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-xs">
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
            className="font-mono text-sm"
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={busy || !url.trim()}
        >
          {busy ? "Switching…" : "Switch organization"}
        </Button>
      </form>
    </div>
  );
}

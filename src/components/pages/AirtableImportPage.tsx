"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/contexts/page-header";

type ImportStatus = "idle" | "creating" | "importing" | "done" | "error";

export function AirtableImportPage() {
  usePageTitle("Airtable Import");
  const [airtableKey, setAirtableKey] = useState("");
  const [airtableBaseId, setAirtableBaseId] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleImport = useCallback(async () => {
    if (!airtableKey.trim() || !airtableBaseId.trim()) {
      toast.error("Please enter both API key and Base ID");
      return;
    }

    try {
      setStatus("creating");
      setErrorMessage("");

      const syncResult = await fetchApi<{ id: string }>(
        "/api/airtable-import/sync",
        {
          method: "POST",
          body: JSON.stringify({
            baseId: airtableBaseId.trim(),
            airtableKey: airtableKey.trim(),
            options: { syncData: true },
          }),
        },
      );

      if (!syncResult?.id) {
        throw new Error("Failed to create sync source");
      }

      setStatus("importing");
      await fetchApi("/api/airtable-import/trigger", {
        method: "POST",
        body: JSON.stringify({ syncId: syncResult.id }),
      });

      setStatus("done");
      toast.success("Airtable import completed");
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Import failed";
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [airtableKey, airtableBaseId]);

  const isBusy = status === "creating" || status === "importing";

  return (
    <div className="flex h-full flex-col overflow-auto py-4">
      <p className="mb-4 text-[12px] text-muted-foreground">
        Import data from an Airtable base into your CRM
      </p>

      <div className="max-w-lg space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Connection Details</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Enter your Airtable Personal Access Token and Base ID to begin.
          </p>

          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="at-key" className="text-[12px]">
                Personal Access Token
              </Label>
              <Input
                id="at-key"
                type="password"
                placeholder="pat..."
                value={airtableKey}
                onChange={(e) => setAirtableKey(e.target.value)}
                disabled={isBusy}
                autoComplete="off"
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at-base" className="text-[12px]">
                Base ID or Shared URL
              </Label>
              <Input
                id="at-base"
                placeholder="appXXXXXXXXXXXXXX"
                value={airtableBaseId}
                onChange={(e) => setAirtableBaseId(e.target.value)}
                disabled={isBusy}
                className="h-8 text-[13px]"
              />
            </div>

            {status === "error" && errorMessage && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-[12px] text-destructive">
                <XCircle className="size-3.5 shrink-0" />
                {errorMessage}
              </div>
            )}

            {status === "done" && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-2.5 text-[12px] text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Import completed. Your data is now available in the CRM.
              </div>
            )}

            <Button
              size="sm"
              onClick={handleImport}
              disabled={!airtableKey.trim() || !airtableBaseId.trim() || isBusy}
              className="h-8 w-full gap-1.5 text-[13px]"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {status === "creating" ? "Setting up…" : "Importing…"}
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Import from Airtable
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

AirtableImportPage.path = "/airtable-import";

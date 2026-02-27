"use client";

import { useState, useCallback } from "react";
import { EyeIcon, EyeOffIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useGateway } from "@/hooks/useGateway";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const VALID_PREFIXES = ["bos_live_sk_", "bos_test_sk_"] as const;

function isValidApiKey(key: string): boolean {
  return VALID_PREFIXES.some((p) => key.startsWith(p));
}

function maskApiKey(key: string): string {
  if (key.length <= 16) return key.slice(0, 12) + "****";
  return key.slice(0, 12) + "..." + key.slice(-4);
}

const DASHBOARD_URL = "https://basics.so/dashboard";

export function SettingsPage() {
  const { apiKey, hasKey, setApiKey, clearApiKey } = useGateway();
  const [inputValue, setInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error("Please enter an API key");
      return;
    }
    if (!isValidApiKey(trimmed)) {
      toast.error("API key must start with bos_live_sk_ or bos_test_sk_");
      return;
    }
    try {
      setApiKey(trimmed);
      setInputValue("");
      toast.success("API key saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save key");
    }
  }, [inputValue, setApiKey]);

  const handleClear = useCallback(() => {
    clearApiKey();
    setInputValue("");
    setClearDialogOpen(false);
    toast.success("API key cleared");
  }, [clearApiKey]);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Application settings</p>
      </div>
      <Separator />

      {/* Basics API section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Basics API</h2>
          <p className="text-sm text-muted-foreground">
            API key for chat, voice, and AI features. Get one from the Basics
            dashboard.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showPassword ? "text" : "password"}
                placeholder={
                  hasKey ? maskApiKey(apiKey!) : "Paste your bos_live_sk_... key"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pr-9"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide key" : "Show key"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
            </div>
            <Button onClick={handleSave} disabled={!inputValue.trim()}>
              Save
            </Button>
          </div>
          {hasKey && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Configured: {maskApiKey(apiKey!)}
              </span>
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Clear
                  </Button>
                </DialogTrigger>
                <DialogContent showCloseButton={true}>
                  <DialogHeader>
                    <DialogTitle>Clear API key?</DialogTitle>
                    <DialogDescription>
                      This will remove your API key. Chat and voice features
                      will stop working until you add a new key.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton={true}>
                    <Button variant="destructive" onClick={handleClear}>
                      Clear key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <Alert>
          <AlertDescription>
            <a
              href={DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Get an API key from basics.so
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </AlertDescription>
        </Alert>
      </section>
    </div>
  );
}

SettingsPage.path = "/settings";

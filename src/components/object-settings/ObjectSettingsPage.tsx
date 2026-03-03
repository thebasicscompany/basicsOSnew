import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import * as icons from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useObject, useAttributes } from "@/hooks/use-object-registry";
import { ObjectConfigTab } from "./ObjectConfigTab";
import { AttributesTab } from "./AttributesTab";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a kebab-case icon name to a Lucide component.
 */
function resolveIcon(name: string): icons.LucideIcon | null {
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  const icon = (icons as Record<string, unknown>)[pascal];
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
  ) {
    return icon as icons.LucideIcon;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ObjectSettingsPage() {
  const { objectSlug } = useParams<{ objectSlug: string }>();
  const navigate = useNavigate();
  const { data: objectConfig, isLoading, error } = useObject(objectSlug ?? "");
  const attributes = useAttributes(objectSlug ?? "");

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---- Error / not found ----
  if (error || !objectConfig) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-muted-foreground">
          {error
            ? `Failed to load object: ${error.message}`
            : "Object not found."}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Go back
        </Button>
      </div>
    );
  }

  const ObjectIcon = resolveIcon(objectConfig.icon);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          {ObjectIcon && (
            <ObjectIcon
              className="size-5"
              style={{ color: objectConfig.iconColor || undefined }}
            />
          )}
          <h1 className="text-xl font-semibold tracking-tight">
            {objectConfig.pluralName} Settings
          </h1>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="configuration">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="pt-4">
          <ObjectConfigTab objectConfig={objectConfig} />
        </TabsContent>

        <TabsContent value="attributes" className="pt-4">
          <AttributesTab
            objectSlug={objectConfig.slug}
            attributes={attributes}
          />
        </TabsContent>

        <TabsContent value="import" className="pt-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <p className="text-sm text-muted-foreground">
              Import functionality coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

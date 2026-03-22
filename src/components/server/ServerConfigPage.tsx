"use client";

import { SwitchOrganizationBlock } from "@/components/auth/switch-organization-block";

type ServerConfigPageProps = {
  /** Shown when the gate could not reach the configured server */
  initialError?: string | null;
};

export function ServerConfigPage({ initialError }: ServerConfigPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Switch organization
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your organization&apos;s server link (the address that serves{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/health</code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/api</code>
            ).
          </p>
        </div>
        <SwitchOrganizationBlock
          unstyled
          hideHeading
          initialError={initialError}
        />
      </div>
    </div>
  );
}

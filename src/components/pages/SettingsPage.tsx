import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Application settings</p>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground">Settings migration in progress.</p>
    </div>
  );
}

SettingsPage.path = "/settings";

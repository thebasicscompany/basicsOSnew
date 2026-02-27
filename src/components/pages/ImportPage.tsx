import { Separator } from "@/components/ui/separator";

export function ImportPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">Import contacts from CSV</p>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground">Import migration in progress.</p>
    </div>
  );
}

ImportPage.path = "/import";

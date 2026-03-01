import { Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ImportPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">Import contacts from CSV</p>
      </div>
      <Separator />
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card py-16 text-center">
        <Upload className="size-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium">CSV import coming soon</p>
          <p className="text-sm text-muted-foreground">
            You'll be able to bulk import contacts directly from a CSV file.
          </p>
        </div>
      </div>
    </div>
  );
}

ImportPage.path = "/import";

import { usePageTitle } from "@/contexts/page-header";
import { ImportWizard } from "@/components/import/ImportWizard";

export function ImportPage() {
  usePageTitle("Import");

  return (
    <div className="flex h-full flex-col overflow-auto py-4">
      <p className="mb-4 text-[12px] text-muted-foreground">
        Import contacts from a CSV file. Map columns, create custom fields if needed, and merge with
        existing data.
      </p>
      <div className="max-w-2xl">
        <ImportWizard />
      </div>
    </div>
  );
}

ImportPage.path = "/import";

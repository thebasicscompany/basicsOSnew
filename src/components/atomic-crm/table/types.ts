import type { RaRecord } from "ra-core";
import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

export type CRMListTableProps<RecordType extends RaRecord = RaRecord> = {
  /** TanStack column definitions */
  columns: ColumnDef<RecordType, unknown>[];
  /** Sortable field IDs for the toolbar dropdown. When set, renders minimal Sort+Filter bar above table. */
  sortFields?: string[];
  /** Actions to render in the table toolbar (e.g. Import, Export, Create). Shown alongside Sort and Filter. */
  toolbarActions?: ReactNode;
  /** Override row click behavior. Default: "show" */
  rowClick?:
    | "show"
    | "edit"
    | false
    | ((
        id: string,
        resource: string,
        record: RecordType
      ) => string | Promise<string>);
  /** Override bulk action buttons. Default: BulkActionsToolbarChildren */
  bulkActionButtons?: ReactNode;
  /** Additional className for the table wrapper */
  className?: string;
};

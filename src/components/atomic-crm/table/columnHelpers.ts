import type { ColumnDef, RowData } from "@tanstack/react-table";

export type CreateColumnOptions<RecordType extends RowData, TValue = unknown> = {
  id?: string;
  header: string | (() => React.ReactNode);
  accessorKey?: keyof RecordType & string;
  accessorFn?: (row: RecordType) => TValue;
  cell?: (info: {
    getValue: () => TValue;
    row: { original: RecordType };
  }) => React.ReactNode;
  enableSorting?: boolean;
  enableResizing?: boolean;
  size?: number;
  meta?: Record<string, unknown>;
};

/**
 * Creates a column definition with sensible defaults for CRM list tables.
 *
 * @example
 * createColumn<Company>({
 *   id: "name",
 *   header: "Company",
 *   accessorKey: "name",
 *   cell: () => <CompanyNameCell />,
 *   size: 200,
 *   enableResizing: true,
 * })
 */
export function createColumn<RecordType extends RowData, TValue = unknown>(
  options: CreateColumnOptions<RecordType, TValue>
): ColumnDef<RecordType, TValue> {
  const {
    id,
    header,
    accessorKey,
    accessorFn,
    cell,
    enableResizing = true,
    size,
    enableSorting,
    meta,
  } = options;

  const columnDef: ColumnDef<RecordType, TValue> = {
    id: id ?? (accessorKey as string),
    header: typeof header === "string" ? header : header,
    enableResizing,
    size,
    enableSorting,
    meta,
  };

  if (accessorKey) {
    columnDef.accessorKey = accessorKey;
  } else if (accessorFn) {
    columnDef.accessorFn = accessorFn;
  }

  if (cell) {
    columnDef.cell = (info) =>
      cell({
        getValue: info.getValue,
        row: info.row,
      });
  }

  return columnDef;
}

export type { ColumnDef };

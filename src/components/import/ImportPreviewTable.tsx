import { ArrowRightIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedCSV } from "./import-utils";
import type { ColumnMapping } from "@/hooks/use-import";

const PREVIEW_ROWS = 10;

export interface ImportPreviewTableProps {
  parsed: ParsedCSV;
  mapping: ColumnMapping;
  customFieldNames: Set<string>;
  onImport: () => void;
}

export function ImportPreviewTable({
  parsed,
  mapping,
  customFieldNames: _customFieldNames,
  onImport,
}: ImportPreviewTableProps) {
  const previewRows = useMemo(
    () => parsed.rows.slice(0, PREVIEW_ROWS),
    [parsed.rows],
  );

  const mappedColumns = useMemo(() => {
    const cols: { target: string; index: number }[] = [];
    for (const [target, idx] of Object.entries(mapping)) {
      cols.push({ target: parsed.headers[idx] ?? target, index: idx });
    }
    return cols.sort((a, b) => a.index - b.index);
  }, [mapping, parsed.headers]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-muted-foreground">
        Preview of the first {PREVIEW_ROWS} rows. Click Import to proceed.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              {mappedColumns.map(({ target }) => (
                <TableHead key={target}>{target}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground text-xs">
                  {i + 1}
                </TableCell>
                {mappedColumns.map(({ index }) => (
                  <TableCell key={index} className="max-w-[200px] truncate">
                    {row[index] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">
          {parsed.rows.length} total rows
        </span>
        <Button onClick={onImport}>
          Import {parsed.rows.length} rows
          <ArrowRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}

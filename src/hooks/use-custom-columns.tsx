import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { useCustomFieldDefs } from "./use-custom-field-defs";

export function useCustomColumns<
  TData extends { customFields?: Record<string, unknown> },
>(resource: "contacts" | "companies" | "deals"): ColumnDef<TData>[] {
  const { data: defs = [] } = useCustomFieldDefs(resource);
  return defs.map(
    (def): ColumnDef<TData> => ({
      id: `custom_${def.name}`,
      accessorFn: (row) => row.customFields?.[def.name],
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={def.label} />
      ),
      meta: { title: def.label },
      cell: ({ getValue }) => {
        const val = getValue<unknown>();
        if (val == null) return "—";
        if (def.fieldType === "boolean") return val ? "Yes" : "No";
        if (def.fieldType === "date" && typeof val === "string") {
          return new Date(val).toLocaleDateString();
        }
        return String(val);
      },
    })
  );
}

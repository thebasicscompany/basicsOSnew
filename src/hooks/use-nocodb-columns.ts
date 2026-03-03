import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nocoFetch } from "@/lib/nocodb/client";
import { getTableId } from "@/lib/nocodb/table-map";

/**
 * NocoDB column definition returned by the Meta API.
 */
export interface NocoDBColumn {
  id: string;
  fk_model_id: string;
  title: string;
  column_name: string;
  uidt: string; // UI data type: SingleLineText, Number, Date, Checkbox, etc.
  dt: string; // Database type
  np: number | null;
  ns: number | null;
  clen: number | null;
  cop: string;
  pk: boolean;
  pv: boolean;
  rqd: boolean;
  un: boolean;
  ai: boolean;
  unique: boolean;
  cdf: string | null;
  cc: string;
  csn: string;
  dtx: string;
  dtxp: string;
  dtxs: string;
  au: boolean;
  order: number;
  system: boolean;
  meta: Record<string, unknown> | null;
}

/** Map CRM field types to NocoDB uidt values */
const FIELD_TYPE_TO_UIDT: Record<string, string> = {
  text: "SingleLineText",
  "long-text": "LongText",
  number: "Number",
  currency: "Currency",
  select: "SingleSelect",
  "multi-select": "MultiSelect",
  status: "SingleSelect",
  checkbox: "Checkbox",
  date: "Date",
  timestamp: "DateTime",
  rating: "Rating",
  email: "Email",
  domain: "URL",
  phone: "PhoneNumber",
  location: "SingleLineText",
  user: "SingleLineText",
  relationship: "LinkToAnotherRecord",
  // Legacy keys
  boolean: "Checkbox",
  url: "URL",
  longText: "LongText",
};

/**
 * Fetch all columns for a NocoDB table.
 * Uses the Meta API: GET /api/v2/meta/tables/{tableId}
 * Columns are embedded in the table metadata response.
 */
export function useTableColumns(resource: string) {
  return useQuery<NocoDBColumn[]>({
    queryKey: ["nocodb-columns", resource],
    queryFn: async () => {
      const tableId = getTableId(resource);
      const response = await nocoFetch<{ columns: NocoDBColumn[] }>(
        `/api/v2/meta/tables/${tableId}`,
      );
      return response.columns;
    },
    enabled: !!resource,
  });
}

/**
 * Create a new column on a NocoDB table.
 * Uses: POST /api/v2/meta/tables/{tableId}/columns
 */
export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      resource: string;
      title: string;
      fieldType: string;
      options?: Array<{ id: string; label: string; color: string }> | string[];
    }) => {
      const tableId = getTableId(params.resource);
      const uidt = FIELD_TYPE_TO_UIDT[params.fieldType] ?? "SingleLineText";

      const body: Record<string, unknown> = {
        title: params.title,
        column_name: params.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_"),
        uidt,
      };

      // For SingleSelect/MultiSelect, include options as dtxp
      if (
        (uidt === "SingleSelect" || uidt === "MultiSelect") &&
        params.options?.length
      ) {
        // Options can be SelectOption[] objects or plain strings
        const labels = params.options.map((opt) =>
          typeof opt === "string" ? opt : opt.label,
        );
        body.dtxp = labels.join(",");
      }

      return nocoFetch<NocoDBColumn>(
        `/api/v2/meta/tables/${tableId}/columns`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["nocodb-columns", vars.resource] });
      // Also invalidate the object registry to pick up the new column
      qc.invalidateQueries({ queryKey: ["object-config"] });
    },
  });
}

/**
 * Delete a column from a NocoDB table.
 * Uses: DELETE /api/v2/meta/columns/{columnId}
 */
export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { columnId: string; resource: string }) => {
      return nocoFetch(`/api/v2/meta/columns/${params.columnId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["nocodb-columns", vars.resource] });
    },
  });
}

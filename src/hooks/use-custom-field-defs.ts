import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface CustomFieldDef {
  id: number;
  resource: string;
  name: string;
  label: string;
  fieldType: "text" | "number" | "date" | "select" | "boolean";
  options?: string[];
  position: number;
  createdAt?: string;
}

export function useCustomFieldDefs(resource: string) {
  return useQuery<CustomFieldDef[]>({
    queryKey: ["custom_field_defs", resource],
    queryFn: () =>
      fetchApi<CustomFieldDef[]>(
        `/api/custom_field_defs?resource=${encodeURIComponent(resource)}`
      ),
  });
}

export function useCreateCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resource: string;
      name: string;
      label: string;
      fieldType: string;
      options?: string[];
    }) =>
      fetchApi<CustomFieldDef>("/api/custom_field_defs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["custom_field_defs", vars.resource] });
    },
  });
}

export function useDeleteCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resource }: { id: number; resource: string }) =>
      fetchApi(`/api/custom_field_defs/${id}`, { method: "DELETE" }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["custom_field_defs", vars.resource],
      });
    },
  });
}

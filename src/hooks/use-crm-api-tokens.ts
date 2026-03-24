import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface CrmApiTokenRow {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CrmApiTokensListResponse {
  tokens: CrmApiTokenRow[];
}

export interface CrmApiTokenCreateResponse extends CrmApiTokenRow {
  token: string;
}

export function useCrmApiTokens(enabled: boolean) {
  return useQuery({
    queryKey: ["crm-api-tokens"],
    queryFn: () => fetchApi<CrmApiTokensListResponse>("/api/api-tokens"),
    enabled,
  });
}

export function useCreateCrmApiToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      fetchApi<CrmApiTokenCreateResponse>("/api/api-tokens", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-api-tokens"] });
    },
  });
}

export function useRevokeCrmApiToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ ok: boolean }>(`/api/api-tokens/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-api-tokens"] });
    },
  });
}

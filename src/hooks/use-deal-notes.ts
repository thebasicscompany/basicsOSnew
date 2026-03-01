import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, create, remove } from "@/lib/api/crm";

export interface DealNote {
  id: number;
  dealId: number;
  text: string;
  date: string;
  type: string | null;
  salesId: number | null;
}

export function useDealNotes(dealId: number | null) {
  return useQuery({
    queryKey: ["deal_notes", dealId],
    queryFn: () =>
      getList<DealNote>("deal_notes", {
        filter: { deal_id: dealId },
        sort: { field: "date", order: "DESC" },
        pagination: { page: 1, perPage: 50 },
      }),
    enabled: dealId != null,
  });
}

export function useCreateDealNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { dealId: number; text: string }) =>
      create<DealNote>("deal_notes", { ...data, date: new Date().toISOString() }),
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries({ queryKey: ["deal_notes", dealId] });
    },
  });
}

export function useDeleteDealNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dealId }: { id: number; dealId: number }) =>
      remove<DealNote>("deal_notes", id).then((r) => ({ ...r, dealId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal_notes", (data as any).dealId] });
    },
  });
}

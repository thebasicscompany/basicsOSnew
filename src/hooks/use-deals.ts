import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, getOne, create, update, remove, type ListParams } from "@/lib/api/crm";

export interface Deal {
  id: number;
  name: string;
  companyId: number | null;
  contactIds: number[] | null;
  category: string | null;
  stage: string;
  description: string | null;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  expectedClosingDate: string | null;
  salesId: number | null;
  index: number | null;
}

export function useDeals(params: ListParams = {}) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: () => getList<Deal>("deals", params),
  });
}

export function useDeal(id: number) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: () => getOne<Deal>("deals", id),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Deal>) => create<Deal>("deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Deal> }) =>
      update<Deal>("deals", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remove<Deal>("deals", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

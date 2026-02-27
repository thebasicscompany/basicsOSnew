import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, getOne, create, update, remove, type ListParams } from "@/lib/api/crm";

export interface CompanySummary {
  id: number;
  name: string;
  sector: string | null;
  size: number | null;
  website: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  stateAbbr: string | null;
  country: string | null;
  revenue: string | null;
  logo: { src: string } | null;
  linkedinUrl: string | null;
  description: string | null;
  createdAt: string | null;
  salesId: number | null;
  nbDeals: number;
  nbContacts: number;
}

export function useCompanies(params: ListParams = {}) {
  return useQuery({
    queryKey: ["companies_summary", params],
    queryFn: () => getList<CompanySummary>("companies_summary", params),
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ["companies_summary", id],
    queryFn: () => getOne<CompanySummary>("companies_summary", id),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CompanySummary>) =>
      create<CompanySummary>("companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanySummary> }) =>
      update<CompanySummary>("companies", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remove<CompanySummary>("companies", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
    },
  });
}

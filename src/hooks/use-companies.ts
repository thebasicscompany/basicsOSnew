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
  customFields?: Record<string, unknown>;
}

export interface Company extends Omit<CompanySummary, "nbDeals" | "nbContacts"> {
  customFields?: Record<string, unknown>;
}

export function useCompanies(params: ListParams = {}) {
  return useQuery({
    queryKey: ["companies_summary", params],
    queryFn: () => getList<CompanySummary>("companies_summary", params),
  });
}

export function useCompany(id: number | null) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => getOne<Company>("companies", id!),
    enabled: id != null,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Company>) =>
      create<Company>("companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Company> }) =>
      update<Company>("companies", id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remove<Company>("companies", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies_summary"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, getOne, create, update, remove, type ListParams } from "@/lib/api/crm";

export interface ContactSummary {
  id: number;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  title: string | null;
  email: string | null;
  emailJsonb: { email: string; type: string }[] | null;
  phoneJsonb: { number: string; type: string }[] | null;
  status: string | null;
  avatar: { src: string } | null;
  background: string | null;
  companyId: number | null;
  companyName: string | null;
  nbTasks: number;
  firstSeen: string | null;
  lastSeen: string | null;
  hasNewsletter: boolean | null;
  linkedinUrl: string | null;
  tags: number[] | null;
  salesId: number | null;
}

export function useContacts(params: ListParams = {}) {
  return useQuery({
    queryKey: ["contacts_summary", params],
    queryFn: () => getList<ContactSummary>("contacts_summary", params),
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ["contacts_summary", id],
    queryFn: () => getOne<ContactSummary>("contacts_summary", id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactSummary>) =>
      create<ContactSummary>("contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactSummary> }) =>
      update<ContactSummary>("contacts", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remove<ContactSummary>("contacts", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

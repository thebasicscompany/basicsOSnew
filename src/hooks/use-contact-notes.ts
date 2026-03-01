import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, create, remove } from "@/lib/api/crm";

export interface ContactNote {
  id: number;
  contactId: number;
  text: string;
  date: string;
  salesId: number | null;
  status: string | null;
}

export function useContactNotes(contactId: number | null) {
  return useQuery({
    queryKey: ["contact_notes", contactId],
    queryFn: () =>
      getList<ContactNote>("contact_notes", {
        filter: { contact_id: contactId },
        sort: { field: "date", order: "DESC" },
        pagination: { page: 1, perPage: 50 },
      }),
    enabled: contactId != null,
  });
}

export function useCreateContactNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { contactId: number; text: string }) =>
      create<ContactNote>("contact_notes", { ...data, date: new Date().toISOString() }),
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ["contact_notes", contactId] });
    },
  });
}

export function useDeleteContactNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contactId }: { id: number; contactId: number }) =>
      remove<ContactNote>("contact_notes", id).then((r) => ({ ...r, contactId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contact_notes", (data as any).contactId] });
    },
  });
}

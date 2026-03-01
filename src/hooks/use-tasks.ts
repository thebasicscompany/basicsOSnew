import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getList, create, update, remove } from "@/lib/api/crm";

export interface Task {
  id: number;
  contactId: number;
  salesId: number | null;
  type: string | null;
  text: string | null;
  dueDate: string | null;
  doneDate: string | null;
}

export interface CreateTaskData {
  contactId: number;
  type?: string;
  text: string;
  dueDate?: string;
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () =>
      getList<Task>("tasks", {
        sort: { field: "due_date", order: "ASC" },
        pagination: { page: 1, perPage: 500 },
      }),
  });
}

export function useMarkTaskDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      update<Task>("tasks", id, {
        doneDate: done ? new Date().toISOString() : null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remove<Task>("tasks", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskData) => create<Task>("tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

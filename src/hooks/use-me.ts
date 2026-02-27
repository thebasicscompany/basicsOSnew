import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface Identity {
  id: number;
  fullName: string;
  avatar?: string;
  administrator?: boolean;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetchApi<Identity>("/api/me"),
  });
}

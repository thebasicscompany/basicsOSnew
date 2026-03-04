import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordFavorite {
  id: number;
  crmUserId: number;
  objectSlug: string;
  recordId: number;
  createdAt: string;
}

interface ToggleFavoriteResponse {
  favorited: boolean;
}

// ---------------------------------------------------------------------------
// useFavorites — fetch the current user's favorites
// ---------------------------------------------------------------------------

/**
 * Fetch all favorites for the current user.
 * Optionally filter by object slug.
 *
 * GET /api/object-config/favorites[?objectSlug=...]
 */
export function useFavorites(objectSlug?: string) {
  return useQuery<RecordFavorite[]>({
    queryKey: ["favorites", objectSlug ?? "all"],
    queryFn: () => {
      const qs = objectSlug
        ? `?objectSlug=${encodeURIComponent(objectSlug)}`
        : "";
      return fetchApi<RecordFavorite[]>(`/api/object-config/favorites${qs}`);
    },
  });
}

// ---------------------------------------------------------------------------
// useToggleFavorite — add or remove a favorite
// ---------------------------------------------------------------------------

/**
 * Toggle a record as favorite.
 * POST /api/object-config/favorites { objectSlug, recordId }
 *
 * Returns { favorited: boolean } indicating whether it was added or removed.
 */
export function useToggleFavorite() {
  const qc = useQueryClient();

  return useMutation<
    ToggleFavoriteResponse,
    Error,
    { objectSlug: string; recordId: number }
  >({
    mutationFn: (body) =>
      fetchApi<ToggleFavoriteResponse>("/api/object-config/favorites", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_, variables) => {
      // Invalidate the specific object slug query and the "all" query
      qc.invalidateQueries({
        queryKey: ["favorites", variables.objectSlug],
      });
      qc.invalidateQueries({ queryKey: ["favorites", "all"] });
    },
  });
}

// ---------------------------------------------------------------------------
// useIsFavorite — convenience hook to check if a specific record is favorited
// ---------------------------------------------------------------------------

/**
 * Check if a specific record is in the user's favorites.
 */
export function useIsFavorite(objectSlug: string, recordId: number): boolean {
  const { data: favorites = [] } = useFavorites(objectSlug);
  return favorites.some(
    (f) => f.objectSlug === objectSlug && f.recordId === recordId,
  );
}

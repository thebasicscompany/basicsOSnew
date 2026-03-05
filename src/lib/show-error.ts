import { toast } from "sonner";
import { ApiError } from "@/lib/api";

/**
 * Show an error toast from an API error, Error, or unknown.
 * Uses the API message when available, otherwise falls back.
 *
 * @param err Error from mutation/query (ApiError, Error, or thrown value)
 * @param fallback Message when err has no useful message (e.g. "Failed to save contact")
 */
export function showError(err: unknown, fallback = "Something went wrong"): void {
  if (err instanceof ApiError) {
    toast.error(err.message);
    return;
  }
  if (err instanceof Error && err.message) {
    toast.error(err.message);
    return;
  }
  toast.error(fallback);
}

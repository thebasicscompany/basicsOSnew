const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Generic fetch wrapper with credentials and JSON handling.
 */
export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((error as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch a list resource that returns Content-Range header for total count.
 */
export async function fetchApiList<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T[]; total: number }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  const contentRange = res.headers.get("Content-Range");
  const total = contentRange ? parseInt(contentRange.split("/")[1] ?? "0", 10) : 0;
  const data = (await res.json()) as T[];
  return { data, total };
}

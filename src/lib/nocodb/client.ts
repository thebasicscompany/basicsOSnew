/**
 * NocoDB REST API client.
 * Thin fetch wrapper that injects the xc-token header.
 */

let _baseUrl = "";
let _token = "";

export function configureNocoClient(baseUrl: string, token: string) {
  _baseUrl = baseUrl.replace(/\/$/, "");
  _token = token;
}

export async function nocoFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${_baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "xc-token": _token,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`NocoDB ${res.status}: ${body}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

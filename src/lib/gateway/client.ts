/**
 * Gateway API clients — plain fetch wrappers with auth injection and typed errors.
 * No React, no hooks, no global state.
 */

import { GatewayApiError } from "./types";

interface ErrorPayload {
  error?: {
    message?: string;
    type?: string;
    param?: string | null;
    code?: string;
  };
}

async function parseErrorResponse(res: Response): Promise<GatewayApiError> {
  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (isJson) {
    try {
      const body = (await res.json()) as ErrorPayload;
      const err = body.error;
      if (err) {
        return new GatewayApiError(err.message ?? res.statusText, {
          code: err.code ?? "unknown",
          type: err.type ?? "unknown",
          status: res.status,
        });
      }
    } catch {
      // Fall through to generic error
    }
  }

  return new GatewayApiError(res.statusText || `HTTP ${res.status}`, {
    code: "unknown",
    type: "unknown",
    status: res.status,
  });
}

function createFetch(
  token: string,
  baseUrl: string,
): (path: string, init?: RequestInit) => Promise<Response> {
  const base = baseUrl.replace(/\/$/, "");

  return async (path: string, init?: RequestInit): Promise<Response> => {
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return res;
  };
}

export interface ApiClient {
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export interface ManageClient {
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
}

/**
 * Creates a client for the public API (chat, audio, email).
 * Uses the bos_live_sk_... API key.
 */
export function createApiClient(apiKey: string, baseUrl: string): ApiClient {
  return {
    fetch: createFetch(apiKey, baseUrl),
  };
}

/**
 * Creates a client for the management API (tenant, keys, billing).
 * Uses the Better Auth session token.
 */
export function createManageClient(
  sessionToken: string,
  baseUrl: string,
): ManageClient {
  return {
    fetch: createFetch(sessionToken, baseUrl),
  };
}

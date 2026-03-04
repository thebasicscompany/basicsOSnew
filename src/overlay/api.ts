/**
 * HTTP client for the voice pill overlay.
 * Calls basicsOSnew server (BFF) with Bearer session token.
 */

let cachedApiUrl: string | null = null;
const DEFAULT_TIMEOUT_MS = 30_000;

type GatewayErrorEnvelope = {
  error?:
    | string
    | {
        message?: string;
        code?: string;
      };
};

export class VoiceApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "VoiceApiError";
    this.status = status;
    this.code = code;
  }
}

const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  cachedApiUrl = (await window.electronAPI?.getApiUrl()) ?? "http://localhost:3001";
  return cachedApiUrl;
};

const readErrorEnvelope = async (res: Response): Promise<VoiceApiError> => {
  let fallback = `Request failed (${res.status})`;
  let code: string | undefined;

  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as GatewayErrorEnvelope;
      if (typeof json.error === "string") {
        fallback = json.error;
      } else if (json.error?.message) {
        fallback = json.error.message;
        code = json.error.code;
      }
    } else {
      const text = await res.text();
      if (text.trim()) fallback = text.trim().slice(0, 300);
    }
  } catch {
    // keep fallback
  }

  return new VoiceApiError(fallback, res.status, code);
};

const fetchWithSession = async (
  path: string,
  init: RequestInit,
  options?: { timeoutMs?: number; retries?: number }
): Promise<Response> => {
  const apiUrl = await getApiUrl();
  const token = await window.electronAPI?.getSessionToken();

  if (!token) {
    throw new VoiceApiError("Missing session token", 401, "missing_session");
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? 0;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw await readErrorEnvelope(res);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      attempt += 1;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new VoiceApiError("Voice request failed", 500);
};

export const synthesizeSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const res = await fetchWithSession(
      "/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      },
      { retries: 1 }
    );
    return res.arrayBuffer();
  } catch {
    return null;
  }
};

export const transcribeAudioBlob = async (blob: Blob): Promise<string | null> => {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  try {
    const res = await fetchWithSession(
      "/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64,
          mime_type: blob.type || "audio/webm",
        }),
      },
      { retries: 1 }
    );
    const json = (await res.json()) as { transcript?: string };
    return json.transcript ?? null;
  } catch {
    return null;
  }
};

/** Stub — no backend. Used by meeting recorder. */
export const uploadMeetingTranscript = async (
  _meetingId: string,
  _transcriptText: string
): Promise<void> => {
  // No-op when stubbed
};

/** Stub — no backend. Used by meeting recorder. */
export const processMeeting = async (_meetingId: string): Promise<void> => {
  // No-op when stubbed
};

export async function* streamAssistant(
  message: string,
  history: Array<{ role: string; content: string }>,
  options?: { timeoutMs?: number }
): AsyncGenerator<string> {
  const res = await fetchWithSession(
    "/stream/assistant",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    },
    { timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS }
  );
  if (!res.body) throw new VoiceApiError("Empty stream response", 502);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data) as { token?: string };
            if (parsed.token) yield parsed.token;
          } catch {
            // ignore malformed chunk
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

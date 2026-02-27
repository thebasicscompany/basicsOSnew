/**
 * Gateway audio — speech-to-text and text-to-speech.
 */

import type { ApiClient } from "./client";
import type { TranscriptionResult } from "./types";

/**
 * POST /v1/audio/transcriptions
 * Auto-selects multipart (File) vs JSON (base64) based on input type.
 */
export async function transcribe(
  client: ApiClient,
  input: File | { audio: string; mimeType: string },
  options?: { model?: string },
): Promise<TranscriptionResult> {
  if (input instanceof File) {
    const form = new FormData();
    form.append("file", input);
    if (options?.model) form.append("model", options.model);
    const res = await client.fetch("/v1/audio/transcriptions", {
      method: "POST",
      body: form,
    });
    return res.json() as Promise<TranscriptionResult>;
  }

  const res = await client.fetch("/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options?.model ?? "basics-stt",
      audio: input.audio,
      mime_type: input.mimeType ?? "audio/wav",
    }),
  });
  return res.json() as Promise<TranscriptionResult>;
}

/**
 * POST /v1/audio/speech
 * Returns a Blob — callers use URL.createObjectURL(blob) for <audio>.
 */
export async function speak(
  client: ApiClient,
  input: string,
  options?: { voice?: string; encoding?: string; model?: string },
): Promise<Blob> {
  const res = await client.fetch("/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options?.model ?? "basics-tts",
      input,
      voice: options?.voice ?? "default",
      encoding: options?.encoding ?? "mp3",
    }),
  });
  return res.blob();
}

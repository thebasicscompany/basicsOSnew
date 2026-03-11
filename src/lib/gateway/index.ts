/**
 * Gateway API — single import surface.
 */

export {
  createApiClient,
  createManageClient,
  type ApiClient,
  type ManageClient,
} from "./client";

export {
  transcribe,
  speak,
} from "./audio";

export {
  provision,
  createKey,
  createPortal,
} from "./manage";

export {
  sendEmail,
} from "./email";

export type {
  TranscriptionResult,
  EmailRequest,
  EmailResult,
  NewApiKey,
} from "./types";

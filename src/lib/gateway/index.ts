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
  chatCompletions,
} from "./chat";

export {
  transcribe,
  speak,
} from "./audio";

export {
  provision,
  getKeys,
  createKey,
  revokeKey,
  getTenant,
  updateTenant,
  getUsage,
  getBilling,
  createCheckout,
  createPortal,
  changePlan,
} from "./manage";

export {
  sendEmail,
} from "./email";

export { GatewayApiError } from "./types";
export type {
  GatewayError,
  GatewayErrorCode,
  ChatMessage,
  ChatRequest,
  ModelInfo,
  TranscriptionResult,
  EmbeddingResult,
  EmailRequest,
  EmailResult,
  ApiKey,
  NewApiKey,
  TenantInfo,
  UsageReport,
  UsageTotals,
  UsageDaily,
  UsageModel,
  BillingInfo,
  CheckoutRequest,
  CheckoutResult,
  PortalResult,
  ChangePlanResult,
} from "./types";

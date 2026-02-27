/**
 * Gateway API types — match the Basics Gateway spec exactly.
 * @see GATEWAY_API.md
 */

// --- Error model ---

export interface GatewayError {
  message: string;
  type: string;
  param: string | null;
  code: GatewayErrorCode;
}

export type GatewayErrorCode =
  | "invalid_api_key"
  | "billing_canceled"
  | "billing_delinquent"
  | "rate_limit_exceeded"
  | "quota_exceeded"
  | "invalid_payload"
  | "model_not_found"
  | "service_unavailable"
  | "internal_error"
  | "email_send_failed"
  | "subscription_required"
  | (string & {});

export class GatewayApiError extends Error {
  readonly code: string;
  readonly type: string;
  readonly status: number;

  constructor(
    message: string,
    options: { code?: string; type?: string; status?: number } = {},
  ) {
    super(message);
    this.name = "GatewayApiError";
    this.code = options.code ?? "unknown";
    this.type = options.type ?? "unknown";
    this.status = options.status ?? 0;
  }
}

// --- Chat ---

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  tools?: unknown[];
}

// --- Models ---

export interface ModelInfo {
  id: string;
  object: "model";
  owned_by: string;
  capabilities: string[];
}

// --- Audio ---

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  [key: string]: unknown;
}

// --- Embeddings ---

export interface EmbeddingResult {
  object: "list";
  data: { index: number; embedding: number[] }[];
  model: string;
}

// --- Email ---

export interface EmailRequest {
  to: string;
  subject: string;
  content: string;
}

export interface EmailResult {
  id: string;
  ok: boolean;
}

// --- Manage API: Keys ---

export interface ApiKey {
  id: string;
  name: string;
  keyHint: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface NewApiKey {
  id: string;
  key: string;
  keyHint: string;
}

// --- Manage API: Tenant ---

export interface TenantInfo {
  company: string;
}

// --- Manage API: Usage ---

export interface UsageTotals {
  llmTokens: number;
  embedTokens: number;
  sttSeconds: number;
  ttsChars: number;
  costUsd: number;
  requestCount: number;
}

export interface UsageDaily {
  date: string;
  llmTokens: number;
  embedTokens: number;
  sttSeconds: number;
  ttsChars: number;
  costUsd: number;
}

export interface UsageModel {
  providerModel: string;
  endpoint: string;
  requestCount: number;
  totalTokens: number;
  costUsd: number;
}

export interface UsageReport {
  totals: UsageTotals;
  daily: UsageDaily[];
  models: UsageModel[];
}

// --- Manage API: Billing ---

export interface BillingInfo {
  tenantId: string;
  billingStatus: string;
  planCode: string;
  trialUsed: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  scheduledPlanCode: string | null;
  scheduledPlanEffectiveAt: string | null;
}

export interface CheckoutRequest {
  plan?: "starter" | "pro" | "team";
  successUrl?: string;
  cancelUrl?: string;
  email?: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface PortalResult {
  url: string;
}

export interface ChangePlanResult {
  ok: boolean;
  plan: string;
  effective: "immediate" | "period_end";
  periodEnd: string;
}

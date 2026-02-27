/**
 * Gateway management API — tenant, keys, billing.
 * Uses Better Auth session token (ManageClient).
 */

import type { ManageClient } from "./client";
import type {
  ApiKey,
  BillingInfo,
  ChangePlanResult,
  CheckoutRequest,
  NewApiKey,
  UsageReport,
} from "./types";

export async function provision(
  client: ManageClient,
): Promise<{ tenantId: string }> {
  const res = await client.fetch("/manage/provision");
  return res.json() as Promise<{ tenantId: string }>;
}

export async function getKeys(client: ManageClient): Promise<ApiKey[]> {
  const res = await client.fetch("/manage/keys");
  const body = (await res.json()) as { keys: ApiKey[] };
  return body.keys;
}

export async function createKey(
  client: ManageClient,
  name?: string,
): Promise<NewApiKey> {
  const res = await client.fetch("/manage/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name != null ? { name } : {}),
  });
  return res.json() as Promise<NewApiKey>;
}

export async function revokeKey(
  client: ManageClient,
  id: string,
): Promise<void> {
  await client.fetch(`/manage/keys/${id}`, { method: "DELETE" });
}

export async function getTenant(
  client: ManageClient,
): Promise<{ company: string }> {
  const res = await client.fetch("/manage/tenant");
  return res.json() as Promise<{ company: string }>;
}

export async function updateTenant(
  client: ManageClient,
  data: { company: string },
): Promise<{ company: string }> {
  const res = await client.fetch("/manage/tenant", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ company: string }>;
}

export async function getUsage(
  client: ManageClient,
  days?: number,
): Promise<UsageReport> {
  const qs = days != null ? `?days=${days}` : "";
  const res = await client.fetch(`/manage/usage${qs}`);
  return res.json() as Promise<UsageReport>;
}

export async function getBilling(
  client: ManageClient,
): Promise<BillingInfo> {
  const res = await client.fetch("/manage/billing");
  return res.json() as Promise<BillingInfo>;
}

export async function createCheckout(
  client: ManageClient,
  data?: CheckoutRequest,
): Promise<{ url: string; sessionId: string }> {
  const res = await client.fetch("/manage/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  return res.json() as Promise<{ url: string; sessionId: string }>;
}

export async function createPortal(
  client: ManageClient,
  returnUrl?: string,
): Promise<{ url: string }> {
  const res = await client.fetch("/manage/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnUrl != null ? { returnUrl } : {}),
  });
  return res.json() as Promise<{ url: string }>;
}

export async function changePlan(
  client: ManageClient,
  plan: string,
): Promise<ChangePlanResult> {
  const res = await client.fetch("/manage/billing/change-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  return res.json() as Promise<ChangePlanResult>;
}

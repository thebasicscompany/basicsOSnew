/**
 * Gateway email — tenant-scoped email via Resend.
 */

import type { ApiClient } from "./client";
import type { EmailRequest, EmailResult } from "./types";

/**
 * POST /v1/email/send
 */
export async function sendEmail(
  client: ApiClient,
  data: EmailRequest,
): Promise<EmailResult> {
  const res = await client.fetch("/v1/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<EmailResult>;
}

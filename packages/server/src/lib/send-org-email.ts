import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import { resolveOrgEmailConfig } from "./resolve-org-email-config.js";

async function sendViaSmtp(
  sender: { host: string; port: number; user: string; pass: string; from: string },
  to: string,
  subject: string,
  text: string,
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: sender.host,
    port: sender.port,
    secure: sender.port === 465,
    auth: { user: sender.user, pass: sender.pass },
  });
  await transporter.sendMail({
    from: sender.from,
    to,
    subject,
    text,
  });
}

async function sendViaBasicsApi(
  apiUrl: string,
  apiKey: string,
  to: string,
  subject: string,
  content: string,
): Promise<void> {
  const res = await fetch(`${apiUrl}/v1/email/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ to, subject, content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BasicsOS email send failed (${res.status}): ${text}`);
  }
}

/**
 * Sends an email using the org's configured method (SMTP or BasicsOS API).
 * Returns true if sent, false if no email config available.
 */
export async function sendOrgEmail(
  db: Db,
  env: Env,
  organizationId: string | null,
  params: { to: string; subject: string; content: string },
): Promise<{ ok: boolean; error?: string }> {
  const sender = await resolveOrgEmailConfig(db, env, organizationId);
  if (!sender) {
    return { ok: false, error: "No email config (SMTP or BasicsOS key)" };
  }

  try {
    if (sender.type === "smtp") {
      await sendViaSmtp(sender, params.to, params.subject, params.content);
    } else {
      await sendViaBasicsApi(
        sender.apiUrl,
        sender.apiKey,
        params.to,
        params.subject,
        params.content,
      );
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

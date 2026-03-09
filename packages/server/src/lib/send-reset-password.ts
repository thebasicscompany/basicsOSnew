import { eq } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import * as schema from "@/db/schema/index.js";
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
 * Creates the sendResetPassword callback for Better Auth.
 * Resolution order: org_smtp_config (Settings) → org_ai_config basicsos (Settings) → env MAIL_* → env SERVER_BASICS_API_KEY.
 */
export function createSendResetPassword(db: Db, env: Env) {
  return async (to: string, url: string, authUserId: string): Promise<void> => {
    let organizationId: string | null = null;
    const [crmUser] = await db
      .select({ organizationId: schema.crmUsers.organizationId })
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, authUserId))
      .limit(1);
    if (crmUser?.organizationId) {
      organizationId = crmUser.organizationId;
    }

    const sender = await resolveOrgEmailConfig(db, env, organizationId);
    if (!sender) {
      console.warn(
        "[auth] Password reset email not configured. Set SMTP or BasicsOS key in Settings, or MAIL_* / SERVER_BASICS_API_KEY env vars.",
      );
      return;
    }

    const subject = "Reset your password";
    const content = `Click the link to reset your password: ${url}`;

    try {
      if (sender.type === "smtp") {
        await sendViaSmtp(sender, to, subject, content);
      } else {
        await sendViaBasicsApi(sender.apiUrl, sender.apiKey, to, subject, content);
      }
    } catch (e) {
      console.error("[auth] Password reset email send failed:", e);
    }
  };
}

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
 * Extracts the reset token from Better Auth's reset URL.
 * Format: https://api.example.com/api/auth/reset-password/TOKEN?callbackURL=...
 */
function parseResetTokenFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/reset-password\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates the sendResetPassword callback for Better Auth.
 * Resolution order: org_smtp_config (Settings) → org_ai_config basicsos (Settings) → env MAIL_* → env SERVER_BASICS_API_KEY.
 *
 * When INVITE_LINK_BASE_URL is basicsos.com, the email link points to the hosted
 * reset page (e.g. https://basicsos.com/auth/reset-password?token=...&apiUrl=...)
 * instead of the API's reset endpoint.
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

    // When using hosted auth (basicsos.com), link to the hosted reset page so
    // users get a proper form instead of the API's raw reset endpoint.
    let resetLink = url;
    const baseUrl = (env.INVITE_LINK_BASE_URL ?? "https://basicsos.com").replace(/\/$/, "");
    const isHostedAuth = baseUrl.includes("basicsos.com");
    if (isHostedAuth) {
      const token = parseResetTokenFromUrl(url);
      if (token) {
        const apiOrigin = new URL(env.BETTER_AUTH_URL).origin;
        resetLink = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}&apiUrl=${encodeURIComponent(apiOrigin)}`;
      }
    }

    const subject = "Reset your password";
    const content = `Click the link to reset your password: ${resetLink}`;

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

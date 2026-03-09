import { eq } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import * as schema from "@/db/schema/index.js";
import { decryptApiKey } from "@/lib/api-key-crypto.js";

export type OrgEmailSender =
  | { type: "smtp"; host: string; port: number; user: string; pass: string; from: string }
  | { type: "basicsos"; apiKey: string; apiUrl: string };

/**
 * Resolves the email sender config for an organization.
 * Priority: org_smtp_config (Settings) → org_ai_config basicsos key (Settings) → env MAIL_* → env SERVER_BASICS_API_KEY.
 */
export async function resolveOrgEmailConfig(
  db: Db,
  env: Env,
  organizationId: string | null,
): Promise<OrgEmailSender | null> {
  if (organizationId) {
    const [smtpConfig] = await db
      .select()
      .from(schema.orgSmtpConfig)
      .where(eq(schema.orgSmtpConfig.organizationId, organizationId))
      .limit(1);

    if (smtpConfig?.passwordEnc) {
      const pass = decryptApiKey(smtpConfig.passwordEnc);
      if (pass) {
        return {
          type: "smtp",
          host: smtpConfig.host,
          port: smtpConfig.port,
          user: smtpConfig.user,
          pass,
          from: smtpConfig.fromEmail,
        };
      }
    }

    const [aiConfig] = await db
      .select({ apiKeyEnc: schema.orgAiConfig.apiKeyEnc, keyType: schema.orgAiConfig.keyType })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, organizationId))
      .limit(1);

    if (aiConfig?.keyType === "basicsos" && aiConfig.apiKeyEnc) {
      const apiKey = decryptApiKey(aiConfig.apiKeyEnc);
      if (apiKey) {
        return { type: "basicsos", apiKey, apiUrl: env.BASICSOS_API_URL };
      }
    }
  }

  if (
    env.MAIL_HOST &&
    env.MAIL_PORT != null &&
    env.MAIL_USER &&
    env.MAIL_PASS &&
    env.MAIL_FROM
  ) {
    return {
      type: "smtp",
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      user: env.MAIL_USER,
      pass: env.MAIL_PASS,
      from: env.MAIL_FROM,
    };
  }

  if (env.SERVER_BASICS_API_KEY) {
    return {
      type: "basicsos",
      apiKey: env.SERVER_BASICS_API_KEY,
      apiUrl: env.BASICSOS_API_URL,
    };
  }

  return null;
}

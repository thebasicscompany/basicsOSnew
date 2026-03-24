import { createHash, randomBytes } from "node:crypto";

const PREFIX = "bos_crm_";
const SECRET_BYTE_LEN = 32;

export function hashCrmApiToken(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/** Full token shown once to the user; only a hash is stored. */
export function generateCrmApiToken(): {
  fullToken: string;
  tokenPrefix: string;
  hash: string;
} {
  const suffix = randomBytes(SECRET_BYTE_LEN).toString("base64url");
  const fullToken = `${PREFIX}${suffix}`;
  return {
    fullToken,
    /** Stored and listed so users can tell tokens apart (not secret). */
    tokenPrefix: fullToken.slice(0, 24),
    hash: hashCrmApiToken(fullToken),
  };
}

export function isCrmApiTokenFormat(token: string): boolean {
  return token.startsWith(PREFIX) && token.length > PREFIX.length + 8;
}

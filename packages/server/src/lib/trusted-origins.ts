const ELECTRON_RENDERER_ORIGINS = new Set(["null", "file://"]);

function isElectronUserAgent(userAgent: string | undefined | null): boolean {
  return /\bElectron\//i.test(userAgent ?? "");
}

export function isTrustedOrigin(
  origin: string | undefined | null,
  allowedOrigins: Set<string>,
  userAgent?: string | null,
): boolean {
  if (!origin) return false;

  if (allowedOrigins.has(origin)) return true;

  // Installed Electron apps make cross-origin requests from a file-based renderer.
  if (ELECTRON_RENDERER_ORIGINS.has(origin) && isElectronUserAgent(userAgent)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

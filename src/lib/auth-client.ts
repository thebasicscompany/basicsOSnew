import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Better Auth client — single instance shared across the app.
 * Session state is managed internally via cookies.
 */
export const authClient = createAuthClient({
  baseURL: API_URL || undefined,
});

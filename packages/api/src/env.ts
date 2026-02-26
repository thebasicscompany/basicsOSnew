export function getEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const BASICOS_API_URL = process.env.BASICOS_API_URL ?? "https://api.basics.so";
  const PORT = parseInt(process.env.PORT ?? "3001", 10);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
        "For local dev, use your Supabase project URL and service_role key."
    );
  }

  return {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    BASICOS_API_URL: BASICOS_API_URL.replace(/\/$/, ""),
    PORT,
  };
}

export type Env = ReturnType<typeof getEnv>;

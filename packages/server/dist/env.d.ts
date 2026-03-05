import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodDefault<z.ZodString>;
    BASICOS_API_URL: z.ZodDefault<z.ZodString>;
    API_KEY_ENCRYPTION_KEY: z.ZodOptional<z.ZodString>;
    API_KEY_ENCRYPTION_KEY_PREVIOUS: z.ZodOptional<z.ZodString>;
    API_KEY_HASH_SECRET: z.ZodOptional<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    BASICOS_API_URL: string;
    ALLOWED_ORIGINS: string;
    API_KEY_ENCRYPTION_KEY?: string | undefined;
    API_KEY_ENCRYPTION_KEY_PREVIOUS?: string | undefined;
    API_KEY_HASH_SECRET?: string | undefined;
}, {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    BETTER_AUTH_URL?: string | undefined;
    BASICOS_API_URL?: string | undefined;
    API_KEY_ENCRYPTION_KEY?: string | undefined;
    API_KEY_ENCRYPTION_KEY_PREVIOUS?: string | undefined;
    API_KEY_HASH_SECRET?: string | undefined;
    ALLOWED_ORIGINS?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function getEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map
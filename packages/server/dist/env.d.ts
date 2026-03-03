import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodDefault<z.ZodString>;
    BASICOS_API_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    BASICOS_API_URL: string;
}, {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    BETTER_AUTH_URL?: string | undefined;
    BASICOS_API_URL?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function getEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map
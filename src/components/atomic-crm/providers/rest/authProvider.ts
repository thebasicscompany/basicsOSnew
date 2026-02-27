import { createRestAuthProvider } from "@basics-os/shared/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export const authProvider = createRestAuthProvider(API_URL);

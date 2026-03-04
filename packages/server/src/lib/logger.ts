import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "info" : "info"),
  transport:
    isDev
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  base: { service: "basicsos-server" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

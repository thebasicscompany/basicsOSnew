// Desktop logger — used by main process only (Node)
/* eslint-disable no-console -- logger wrapper; console is intentional */
export type DesktopLogger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const IS_PRODUCTION =
  typeof process !== "undefined" && process.env["NODE_ENV"] === "production";

export const createDesktopLogger = (tag: string): DesktopLogger => {
  const prefix = `[${tag}]`;
  return {
    debug: IS_PRODUCTION
      ? () => {}
      : (...args: unknown[]) => console.log(prefix, ...args),
    info: (...args: unknown[]) => console.log(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
};

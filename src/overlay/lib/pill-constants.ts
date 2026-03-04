export const SPRING = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};
export const CONTENT_ENTER = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};
export const CONTENT_EXIT = { duration: 0.12 };
export const STAGGER_MS = 80;
export const IDLE_HEIGHT = 12;
export const ACTIVE_HEIGHT = 48;

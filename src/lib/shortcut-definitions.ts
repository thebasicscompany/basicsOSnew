const isMac = () =>
  typeof navigator !== "undefined" &&
  /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform);

export interface ShortcutDef {
  label: string;
  mac: string;
  win: string;
  /** Electron globalShortcut / accelerator format */
  electron: string;
}

export const SHORTCUT_DEFINITIONS = {
  assistantToggle: {
    label: "AI Assistant",
    mac: "Shift+Fn",
    win: "Ctrl+Shift+Space",
    electron: "Shift+Fn",
  },
  dictationToggle: {
    label: "Dictation",
    mac: "Fn",
    win: "Ctrl+Space",
    electron: "Fn",
  },
  meetingToggle: {
    label: "Meeting Mode",
    mac: "Shift+M",
    win: "Ctrl+Shift+M",
    electron: "Shift+M",
  },
  commandPalette: {
    label: "Command Palette",
    mac: "Cmd+K",
    win: "Ctrl+K",
    electron: "CommandOrControl+K",
  },
} as const satisfies Record<string, ShortcutDef>;

export type ShortcutKey = keyof typeof SHORTCUT_DEFINITIONS;

/** Returns the platform-appropriate display label (e.g. "Cmd+Space" on Mac, "Ctrl+Space" on Windows). */
export function getShortcutLabel(key: ShortcutKey): string {
  const def = SHORTCUT_DEFINITIONS[key];
  return isMac() ? def.mac : def.win;
}

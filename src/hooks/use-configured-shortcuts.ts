import { useEffect, useMemo, useState } from "react";
import { getShortcutLabel, SHORTCUT_DEFINITIONS } from "@/lib/shortcut-definitions";
import type { OverlaySettings } from "@/shared-overlay/types";

type ShortcutSlot = "dictation" | "assistant" | "meeting";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

const isElectron = () =>
  typeof window !== "undefined" && !!(window as Record<string, unknown>).electronAPI;

const NON_MAC_SHORTCUT_FIELDS: Record<
  ShortcutSlot,
  "assistantToggle" | "dictationHoldKey" | "meetingToggle"
> = {
  dictation: "dictationHoldKey",
  assistant: "assistantToggle",
  meeting: "meetingToggle",
};

const MODIFIER_DISPLAY: Record<string, string> = {
  CommandOrControl: isMac() ? "Cmd" : "Ctrl",
  Control: "Ctrl",
  Ctrl: "Ctrl",
  Command: "Cmd",
  Alt: isMac() ? "Option" : "Alt",
  Shift: "Shift",
  Meta: "Cmd",
  Space: "Space",
};

function formatAccelerator(accelerator?: string | null): string | null {
  if (!accelerator) return null;
  return accelerator
    .split("+")
    .filter(Boolean)
    .map((part) => MODIFIER_DISPLAY[part] ?? part)
    .join("+");
}

function getDisplayValue(slot: ShortcutSlot, settings: OverlaySettings | null): string | null {
  if (!settings) return null;
  if (isMac()) {
    return settings.shortcuts[slot]?.label ?? null;
  }
  const field = NON_MAC_SHORTCUT_FIELDS[slot];
  return formatAccelerator(settings.shortcuts[field]);
}

export type ConfiguredShortcuts = {
  assistant: string;
  dictation: string;
  meeting: string;
  commandPalette: string;
  isElectron: boolean;
  loaded: boolean;
};

/**
 * Reads the user's configured shortcuts from Electron overlay settings.
 * Falls back to platform-aware defaults from SHORTCUT_DEFINITIONS when
 * not running in Electron or before settings load.
 */
export function useConfiguredShortcuts(): ConfiguredShortcuts {
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings | null>(null);
  const [loaded, setLoaded] = useState(!isElectron());

  useEffect(() => {
    if (!isElectron()) return;
    const api = (window as Record<string, unknown>).electronAPI as {
      getOverlaySettings?: () => Promise<OverlaySettings>;
      onSettingsChanged?: (cb: (s: OverlaySettings) => void) => void;
    } | undefined;

    api?.getOverlaySettings?.().then((s) => {
      setOverlaySettings(s);
      setLoaded(true);
    }).catch(() => setLoaded(true));

    api?.onSettingsChanged?.((s) => setOverlaySettings(s));
  }, []);

  return useMemo(() => {
    const assistant = getDisplayValue("assistant", overlaySettings) ?? getShortcutLabel("assistantToggle");
    const dictation = getDisplayValue("dictation", overlaySettings) ?? getShortcutLabel("dictationToggle");
    const meeting = getDisplayValue("meeting", overlaySettings) ?? getShortcutLabel("meetingToggle");
    const commandPalette = getShortcutLabel("commandPalette");

    return { assistant, dictation, meeting, commandPalette, isElectron: isElectron(), loaded };
  }, [overlaySettings, loaded]);
}

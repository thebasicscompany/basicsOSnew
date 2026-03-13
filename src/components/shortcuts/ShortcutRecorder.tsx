import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ShortcutBinding } from "@/shared-overlay/types";

export type ShortcutSlot = "dictation" | "assistant" | "meeting";

type OverlaySettings = {
  shortcuts: {
    dictation?: ShortcutBinding;
    assistant?: ShortcutBinding;
    meeting?: ShortcutBinding;
    assistantToggle: string;
    dictationToggle: string;
    dictationHoldKey: string;
    meetingToggle: string;
    [key: string]: unknown;
  };
  voice: {
    audioInputDeviceId: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ElectronShortcutApi = {
  getOverlaySettings?: () => Promise<OverlaySettings>;
  onSettingsChanged?: (cb: (s: OverlaySettings) => void) => void;
  updateOverlaySettings?: (partial: Partial<OverlaySettings>) => Promise<OverlaySettings>;
  startShortcutRecording?: () => Promise<ShortcutBinding | null>;
  cancelShortcutRecording?: () => Promise<void>;
};

export const NON_MAC_SHORTCUT_FIELDS: Record<
  ShortcutSlot,
  "assistantToggle" | "dictationHoldKey" | "meetingToggle"
> = {
  dictation: "dictationHoldKey",
  assistant: "assistantToggle",
  meeting: "meetingToggle",
};

export const isMac = () =>
  typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

const isWindows = () =>
  typeof navigator !== "undefined" && /Win/i.test(navigator.userAgent);

const MODIFIER_DISPLAY: Record<string, string> = {
  CommandOrControl: isWindows() ? "Ctrl" : "Cmd",
  Control: "Ctrl",
  Ctrl: "Ctrl",
  Command: "Cmd",
  Alt: "Alt",
  Option: isWindows() ? "Alt" : "Option",
  Shift: "Shift",
  Super: isWindows() ? "Win" : "Super",
  Meta: isWindows() ? "Win" : "Meta",
};

const KEY_DISPLAY: Record<string, string> = {
  Space: "Space",
  Return: "Enter",
  Enter: "Enter",
  Esc: "Esc",
  Escape: "Esc",
  Left: "←",
  Right: "→",
  Up: "↑",
  Down: "↓",
  Plus: "+",
};

const SPECIAL_KEY_TOKENS: Record<string, string> = {
  " ": "Space",
  Spacebar: "Space",
  Escape: "Esc",
  Esc: "Esc",
  Enter: "Enter",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Insert: "Insert",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

const keyEventToAcceleratorToken = (event: KeyboardEvent): string | null => {
  const key = event.key;
  if (key === "Control") return "Control";
  if (key === "Shift") return "Shift";
  if (key === "Alt") return "Alt";
  if (key === "Meta") return isMac() ? "Command" : "Super";
  if (/^[a-z0-9]$/i.test(key)) return key.toUpperCase();
  if (/^F\d{1,2}$/i.test(key)) return key.toUpperCase();
  return SPECIAL_KEY_TOKENS[key] ?? null;
};

const keyEventToAccelerator = (event: KeyboardEvent): string | null => {
  const token = keyEventToAcceleratorToken(event);
  if (!token) return null;
  const parts: string[] = [];
  if (event.ctrlKey && token !== "Control") parts.push("Control");
  if (event.altKey && token !== "Alt") parts.push("Alt");
  if (event.shiftKey && token !== "Shift") parts.push("Shift");
  if (event.metaKey && token !== "Command" && token !== "Super") {
    parts.push(isMac() ? "Command" : "Super");
  }
  parts.push(token);
  return parts.join("+");
};

const buildLiveDisplay = (event: KeyboardEvent): string => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.metaKey) parts.push(isMac() ? "Cmd" : "Win");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (!MODIFIER_KEYS.has(event.key)) {
    const token = keyEventToAcceleratorToken(event);
    if (token) parts.push(KEY_DISPLAY[token] ?? token);
  }
  return parts.join("+");
};

export const formatAccelerator = (accelerator?: string | null): string => {
  if (!accelerator) return "Not set";
  return accelerator
    .split("+")
    .filter(Boolean)
    .map((part) => MODIFIER_DISPLAY[part] ?? KEY_DISPLAY[part] ?? part)
    .join(" + ");
};

// Mirrors keyboard-hook.ts MAC_KEYCODE_LABELS so the renderer can display
// a clean label even if the stored ShortcutBinding.label is stale/raw.
const MAC_KEYCODE_LABELS: Record<number, string> = {
  55: "⌘", 54: "Right ⌘", 56: "⇧", 60: "Right ⇧",
  58: "⌥", 61: "Right ⌥", 59: "⌃", 62: "Right ⌃",
  63: "Fn", 57: "⇪", 49: "Space", 36: "↩", 48: "⇥",
  51: "⌫", 53: "⎋", 76: "⌤",
  123: "←", 124: "→", 125: "↓", 126: "↑",
  122: "F1", 120: "F2", 99: "F3", 118: "F4", 96: "F5", 97: "F6",
  98: "F7", 100: "F8", 101: "F9", 109: "F10", 103: "F11", 111: "F12",
};
const MOD_FN = 0x800000;
const MOD_CONTROL = 0x040000;
const MOD_OPTION = 0x080000;
const MOD_SHIFT = 0x020000;
const MOD_COMMAND = 0x100000;
const MODIFIER_KEYCODES = new Set([55, 54, 56, 60, 58, 61, 59, 62, 63, 57]);

function deriveMacLabel(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.modifiers & MOD_FN) parts.push("Fn");
  if (binding.modifiers & MOD_CONTROL) parts.push("⌃");
  if (binding.modifiers & MOD_OPTION) parts.push("⌥");
  if (binding.modifiers & MOD_SHIFT) parts.push("⇧");
  if (binding.modifiers & MOD_COMMAND) parts.push("⌘");
  const keyLabel = MAC_KEYCODE_LABELS[binding.keyCode];
  if (keyLabel && !MODIFIER_KEYCODES.has(binding.keyCode)) {
    parts.push(keyLabel);
  } else if (keyLabel) {
    if (parts.length === 0) parts.push(keyLabel);
  }
  return parts.join("") || binding.label;
}

export const getShortcutDisplayValue = (
  slot: ShortcutSlot,
  settings: OverlaySettings | null,
): string => {
  if (!settings) return "Not set";
  if (isMac()) {
    const binding = settings.shortcuts[slot];
    if (!binding) return "Not set";
    // Re-derive from keyCode+modifiers to avoid stale/raw label like "Key63"
    const derived = deriveMacLabel(binding);
    return derived || binding.label || "Not set";
  }
  const field = NON_MAC_SHORTCUT_FIELDS[slot];
  return formatAccelerator(settings.shortcuts[field]);
};

export const buildShortcutUpdate = (
  slot: ShortcutSlot,
  settings: OverlaySettings | null,
  value: string,
): Partial<OverlaySettings> => {
  const shortcuts: OverlaySettings["shortcuts"] = {
    assistantToggle: settings?.shortcuts.assistantToggle ?? "",
    dictationToggle: settings?.shortcuts.dictationToggle ?? "",
    dictationHoldKey: settings?.shortcuts.dictationHoldKey ?? "",
    meetingToggle: settings?.shortcuts.meetingToggle ?? "",
    ...(settings?.shortcuts ?? {}),
  };
  if (slot === "dictation") {
    shortcuts.dictationHoldKey = value;
    shortcuts.dictationToggle = value;
  } else if (slot === "assistant") {
    shortcuts.assistantToggle = value;
  } else {
    shortcuts.meetingToggle = value;
  }
  return { shortcuts };
};

function KeyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.3)] min-w-[1.4rem] leading-none">
      {label}
    </span>
  );
}

export function ShortcutRow({
  label,
  description,
  value,
  onRecord,
  isRecording,
  liveKeys,
  onCancel,
}: {
  label: string;
  description: string;
  value: string;
  onRecord: () => void;
  isRecording?: boolean;
  liveKeys?: string;
  onCancel?: () => void;
}) {
  if (isRecording) {
    const keyParts = liveKeys ? liveKeys.split("+").filter(Boolean) : [];
    return (
      <li className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">
            Hold keys, then release to set. <kbd className="text-[10px] opacity-60">Esc</kbd> to cancel.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex min-w-[140px] items-center gap-1 rounded-lg border border-primary bg-primary/5 px-2.5 py-1.5">
            {keyParts.length > 0 ? (
              keyParts.map((k, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                  <KeyBadge label={k} />
                </span>
              ))
            ) : (
              <span className="text-xs text-primary/70 animate-pulse select-none">Press keys…</span>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Cancel"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <button
        type="button"
        onClick={onRecord}
        className="shrink-0 min-w-[100px] rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-mono font-medium text-foreground hover:bg-muted hover:border-primary/50 transition-colors cursor-pointer text-center"
        title="Click to change shortcut"
      >
        {value}
      </button>
    </li>
  );
}

export type UseShortcutRecordingReturn = {
  overlaySettings: OverlaySettings | null;
  recordingSlot: ShortcutSlot | null;
  liveKeys: string;
  handleRecordShortcut: (slot: ShortcutSlot) => Promise<void>;
  cancelRecording: () => void;
};

/**
 * Encapsulates the Discord-style shortcut recording logic.
 * Works on both macOS (native CGEventTap via Electron IPC) and Windows/Linux (keyboard events).
 */
export function useShortcutRecording(): UseShortcutRecordingReturn {
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings | null>(null);
  const [recordingSlot, setRecordingSlot] = useState<ShortcutSlot | null>(null);
  const [liveKeys, setLiveKeys] = useState<string>("");
  const recordingRef = useRef(false);
  const heldCodes = useRef<Set<string>>(new Set());
  const committableAccelerator = useRef<string | null>(null);

  useEffect(() => {
    const api = window.electronAPI as ElectronShortcutApi | undefined;
    if (!api?.getOverlaySettings) return;
    void api.getOverlaySettings().then(setOverlaySettings);
    api.onSettingsChanged?.(setOverlaySettings);
  }, []);

  const cancelRecording = useCallback(() => {
    heldCodes.current.clear();
    committableAccelerator.current = null;
    setLiveKeys("");
    setRecordingSlot(null);
    recordingRef.current = false;
    const api = window.electronAPI as ElectronShortcutApi | undefined;
    void api?.cancelShortcutRecording?.();
  }, []);

  const handleRecordShortcut = useCallback(
    async (slot: ShortcutSlot) => {
      const api = window.electronAPI as ElectronShortcutApi | undefined;
      if (!api?.updateOverlaySettings) return;
      if (recordingRef.current) await api.cancelShortcutRecording?.();

      heldCodes.current.clear();
      committableAccelerator.current = null;
      setLiveKeys("");
      setRecordingSlot(slot);
      recordingRef.current = true;

      if (!isMac()) return;
      if (!api.startShortcutRecording) {
        setRecordingSlot(null);
        recordingRef.current = false;
        return;
      }

      try {
        const binding = await api.startShortcutRecording();
        if (!binding) return;
        const updated = await api.updateOverlaySettings({
          shortcuts: { ...overlaySettings?.shortcuts, [slot]: binding },
        } as Partial<OverlaySettings>);
        setOverlaySettings(updated);
        toast.success(`${slot} shortcut set to ${binding.label}`);
      } catch {
        toast.error("Failed to record shortcut");
      } finally {
        setRecordingSlot(null);
        recordingRef.current = false;
      }
    },
    [overlaySettings],
  );

  // Discord-style key recording for non-macOS
  useEffect(() => {
    if (!recordingSlot || isMac()) return;
    const api = window.electronAPI as ElectronShortcutApi | undefined;
    const updateOverlaySettings = api?.updateOverlaySettings;
    if (!updateOverlaySettings) {
      setRecordingSlot(null);
      recordingRef.current = false;
      return;
    }

    heldCodes.current.clear();
    committableAccelerator.current = null;
    setLiveKeys("");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      heldCodes.current.add(event.code);

      if (event.key === "Escape" && heldCodes.current.size === 1) {
        cancelRecording();
        return;
      }

      setLiveKeys(buildLiveDisplay(event));

      if (!MODIFIER_KEYS.has(event.key)) {
        const acc = keyEventToAccelerator(event);
        if (acc) committableAccelerator.current = acc;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      heldCodes.current.delete(event.code);

      if (heldCodes.current.size === 0) {
        const acc = committableAccelerator.current;
        committableAccelerator.current = null;

        if (acc) {
          void updateOverlaySettings(buildShortcutUpdate(recordingSlot, overlaySettings, acc))
            .then((updated) => {
              setOverlaySettings(updated);
              toast.success(`${recordingSlot} shortcut set to ${formatAccelerator(acc)}`);
            })
            .catch(() => toast.error("Failed to update shortcut"))
            .finally(() => {
              setRecordingSlot(null);
              recordingRef.current = false;
            });
        } else {
          setLiveKeys("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    const heldCodesRef = heldCodes.current;
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      heldCodesRef.clear();
    };
  }, [overlaySettings, recordingSlot, cancelRecording]);

  return { overlaySettings, recordingSlot, liveKeys, handleRecordShortcut, cancelRecording };
}

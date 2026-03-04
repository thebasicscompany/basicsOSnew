const isMacPlatform = () =>
  typeof navigator !== "undefined" &&
  /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform);

export function getCommandPaletteShortcutLabel(): string {
  return isMacPlatform() ? "Cmd+K" : "Ctrl+K";
}

export function getPrimaryModifierLabel(): "Cmd" | "Ctrl" {
  return isMacPlatform() ? "Cmd" : "Ctrl";
}

export function dispatchCommandPaletteShortcut(): void {
  const useMeta = isMacPlatform();
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "k",
      metaKey: useMeta,
      ctrlKey: !useMeta,
      bubbles: true,
    }),
  );
}

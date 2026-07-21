# Changelog

## 0.0.2 — 2026-07-21

Initial release. Extracted from redrop's hand-measured native-macOS chrome.

- `electron-cupertino/main` — `createMacWindow()` (hidden-inset titlebar, Notes-position
  traffic lights, sidebar vibrancy without `transparent: true`) and
  `createSettingsWindowManager()` (singleton Finder-style settings window with
  pane-fit resize and key-window focus push).
- `electron-cupertino/preload` — `exposeCupertino()` context bridge (`resizeSettings`,
  `onSettingsFocus`).
- `electron-cupertino` — React `<SettingsWindow>` (animated pane-fit, unfocused chrome
  desaturation, ⌘W/Esc close), `<SFSymbol>`, `useWindowFocus()`.
- `electron-cupertino/symbols` — SF Symbols rendering from the installed SF Pro font;
  84 curated name→codepoint pairs, extensible via `registerSymbols()`.
- `electron-cupertino/css/*` — measured, prefixed CSS: tokens, vibrancy shell + sidebar
  collapse choreography, source-list rows/sections, settings chrome
  (focused **and** unfocused palettes sampled pixel-by-pixel from Finder),
  native form controls with keyboard focus rings, sheets/dialogs/toasts.

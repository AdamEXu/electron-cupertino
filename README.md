# electron-cupertino

Make your Electron app look genuinely macOS-native.

Not "rounded corners and a gray sidebar" native — actually native: real
`NSVisualEffectView` vibrancy behind a transparent sidebar strip, traffic
lights positioned like Notes, source-list rows with the exact 28px pitch and
selection behavior of AppKit sidebars, a Finder-style Settings window whose
frame animates to fit each pane, and SF Symbols rendered from the system font.

Every color and metric in the CSS was measured off 2x screenshots of real
macOS apps (Notes, Finder, Photos, Safari, SF Symbols, Messages) — not
eyeballed.

**macOS-only by nature.** Vibrancy and SF Pro don't exist elsewhere. The
window helpers degrade gracefully on Windows/Linux (solid theme-aware
background, standard frame), but the *look* is a macOS look.

## Install

```sh
npm install electron-cupertino
```

Peer deps: `electron` ≥ 28. `react` ≥ 18 only if you use the components —
the CSS works with any framework or none.

## Quick start

**1. Main process** — the window config that makes vibrancy work (and avoids
the `transparent: true` compositor bug family):

```ts
import { createMacWindow, createSettingsWindowManager } from 'electron-cupertino/main'

const win = createMacWindow({
  width: 1360,
  height: 860,
  show: false,
  webPreferences: { preload: PRELOAD_PATH, sandbox: true, contextIsolation: true }
})
win.on('ready-to-show', () => win.show())
win.loadURL(RENDERER_URL)

const settings = createSettingsWindowManager({
  load: (w) => w.loadURL(RENDERER_URL + '#settings'),
  windowOptions: { webPreferences: { preload: PRELOAD_PATH, sandbox: true, contextIsolation: true } }
})
// e.g. from your app menu:  settings.open()
win.on('closed', () => settings.close()) // single-window app semantics
```

**2. Preload** (optional — enables the Settings window's pane-fit animation
and its focused/unfocused chrome states):

```ts
import { exposeCupertino } from 'electron-cupertino/preload'
exposeCupertino()
```

**3. Renderer** — import the CSS, add `in-native` to `<body>`, use the shell
classes:

```ts
import 'electron-cupertino/css/cupertino.css' // or individual files, see below
```

```html
<body class="in-native">
  <div class="in-shell">                 <!-- add .in-sidebar-collapsed to collapse -->
    <div class="in-titlebar-band">
      <button class="in-sidebar-toggle sf-symbol"><!-- sidebar.left glyph --></button>
    </div>
    <aside class="in-sidebar">
      <div class="in-sidebar-drag-strip"></div>
      <div class="in-sidebar-scroll">
        <nav class="in-sidebar-nav">
          <button class="in-sidebar-item is-active">
            <span class="in-row-icon sf-symbol"><!-- glyph --></span>
            <span class="in-row-label">Library</span>
            <span class="in-row-badge">128</span>
          </button>
        </nav>
      </div>
    </aside>
    <main class="in-content"><!-- your app --></main>
  </div>
</body>
```

React users, on the `#settings` hash route:

```tsx
import { SettingsWindow, SFSymbol, useWindowFocus } from 'electron-cupertino'

<SettingsWindow
  panes={[
    { id: 'general', label: 'General', icon: 'gear', content: <GeneralPane /> },
    { id: 'advanced', label: 'Advanced', icon: 'slider.horizontal.3', content: <AdvancedPane /> }
  ]}
/>
```

Build pane forms with the measured control classes: `in-settings-form`,
`in-settings-row` (+ `in-settings-row-stack` for stacked control columns,
`in-settings-row-gap` where a new group starts), `in-settings-label`,
`in-settings-popup` (NSPopUpButton), `in-settings-button` (NSButton),
`in-settings-check` / `in-settings-checkgroup`, `in-settings-caption`.
Native panes separate groups with whitespace, never a rule — there is
deliberately no separator class.

The settings chrome does the subtle native things too: when the window stops
being key, the chrome desaturates and every accent (checkbox fills, popup
caps) collapses to a plain dark mark — look at a real unfocused Finder
Settings window: there's no blue anywhere in it. Keyboard focus rings, ⌘W/Esc
close, and the height-fit pane animation are all included.

## CSS entry points

| File | Contents |
| --- | --- |
| `electron-cupertino/css/cupertino.css` | everything below |
| `electron-cupertino/css/tokens.css` | design tokens (light+dark), `body.in-native` base, `.sf-symbol` |
| `electron-cupertino/css/shell.css` | vibrancy shell: sidebar strip, collapse choreography, titlebar drag band, toggle |
| `electron-cupertino/css/sidebar.css` | source-list rows, sections + collapse animation, disclosure triangles |
| `electron-cupertino/css/settings.css` | Settings window chrome + native form controls |
| `electron-cupertino/css/controls.css` | sheets, confirm dialogs, buttons, text fields, toasts |

Everything is prefixed (`in-*` classes, `--in-*` custom properties) so nothing
collides with your styles. Retheme by overriding the tokens — e.g.
`--in-accent`.

## SF Symbols

Symbols render as Private Use Area glyphs from the **SF Pro font installed on
the user's Mac** — this package bundles no Apple fonts, artwork, or metadata.
A curated set of ~85 common symbol names ships built-in:

```tsx
import { SFSymbol, symbolGlyph, registerSymbols, symbolNames } from 'electron-cupertino'

<SFSymbol name="sidebar.left" />          // React
element.textContent = symbolGlyph('gear') // no framework
registerSymbols({ 'flame': 0x1002E3 })    // add your own verified codepoints
```

Unknown names render a questionmark fallback, never an empty box. Codepoints
cannot be guessed from symbol order — verify additions against the installed
font (type the character into TextEdit set to SF Pro, or inspect the cmap).

**Licensing note:** Apple licenses the SF fonts and SF Symbols for use on
Apple platforms. Since this package renders from the user's installed system
font and ships none of Apple's assets, a macOS Electron app is squarely the
intended use — but the symbols (and this package's symbol support) are for
Apple-platform apps only. `SF Pro` is unavailable on other OSes; provide your
own icons there.

## API

### `electron-cupertino/main`

- `createMacWindow(options?)` → `BrowserWindow` — hidden-inset titlebar,
  Notes-position traffic lights (`{x:13, y:20}`), `vibrancy: 'sidebar'`,
  deliberately **not** `transparent: true` (vibrancy renders without it —
  Electron #40109 — and transparency brings restore flash,
  devtools-kills-blur, reload-loses-vibrancy, no drop shadow). Your options
  override any default.
- `createSettingsWindowManager({ load, width?, height?, minHeight?, maxHeight?, windowOptions? })`
  → `{ open(), close(), window }` — singleton Finder-style settings window
  (460×320 default — size the width so your labels never wrap; fixed-size,
  hidden titlebar, minimize/zoom disabled). Registers the pane-fit resize IPC
  and pushes key-window state to the renderer (windows are created hidden, so
  the renderer can't learn its focus state from DOM events alone).

### `electron-cupertino/preload`

- `exposeCupertino()` — context-bridge `resizeSettings` and `onSettingsFocus`
  as `window.__cupertino`.

### `electron-cupertino` (renderer, React)

- `<SettingsWindow panes initialPaneId? onPaneChange?>` — native settings
  chrome: centered title, icon-over-label tabs, animated pane-fit, unfocused
  chrome desaturation, Esc/⌘W close.
- `<SFSymbol name className?>`
- `useWindowFocus()` / `watchWindowFocus()` — toggles `in-window-inactive` on
  `<html>` so sidebar chrome dims like native windows.
- symbol utilities re-exported from `electron-cupertino/symbols`.

### `electron-cupertino/symbols` (no framework, no Electron)

- `symbolGlyph(name)`, `glyph(codepoint)`, `hasSymbol(name)`,
  `symbolNames()`, `registerSymbols(map)`.

## License

MIT © Adam Xu. Not affiliated with or endorsed by Apple. "SF Pro" and
"SF Symbols" are trademarks of Apple Inc.

/**
 * Main-process helpers: the BrowserWindow configuration that produces the
 * native macOS look, plus a Finder-style Settings window manager.
 * Import from 'electron-cupertino/main' in your Electron main process only.
 */
import {
  BrowserWindow,
  ipcMain,
  nativeTheme,
  type BrowserWindowConstructorOptions
} from 'electron'

export const IPC_SETTINGS_RESIZE = 'cupertino:settings-resize'
export const IPC_SETTINGS_FOCUS = 'cupertino:settings-focus'

const isMac = process.platform === 'darwin'

/**
 * A main window configured for the native macOS look: hidden-inset titlebar
 * with native traffic lights positioned for a 52pt toolbar (Notes-style —
 * Electron's default {x:12, y:11} does not match native sidebar apps), and
 * sidebar vibrancy.
 *
 * Deliberately NOT `transparent: true` — vibrancy renders independently of it
 * (Electron PR #40109), and transparent windows carry the whole compositor bug
 * family: restore flash, devtools-kills-blur, reload-loses-vibrancy, no drop
 * shadow. This is the Tabby/Motrix production pattern.
 *
 * Pair with `body.in-native` + `.in-shell` markup (css/shell.css): the sidebar
 * strip stays transparent so the vibrancy shows through; the content pane
 * paints opaque on top.
 *
 * Everything is overridable; your options win over the defaults. On Windows
 * and Linux the vibrancy/titlebar options are omitted and a solid theme-aware
 * background is used, so the same call works cross-platform.
 */
export function createMacWindow(options: BrowserWindowConstructorOptions = {}): BrowserWindow {
  const defaults: BrowserWindowConstructorOptions = isMac
    ? {
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 13, y: 20 },
        backgroundColor: '#00000000',
        vibrancy: 'sidebar',
        visualEffectState: 'followWindow'
      }
    : {
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#1f1f21' : '#ffffff'
      }
  return new BrowserWindow({ ...defaults, ...options })
}

interface ManagerRecord {
  readonly win: BrowserWindow | null
  minHeight: number
  maxHeight: number
}

/* One shared IPC handler serves every manager (ipcMain.handle throws on
   duplicate channels); the sender's webContents identifies whose window. */
const managers = new Set<ManagerRecord>()
let resizeHandlerRegistered = false

function registerResizeHandler(): void {
  if (resizeHandlerRegistered) return
  resizeHandlerRegistered = true
  ipcMain.handle(IPC_SETTINGS_RESIZE, (event, contentHeight: number, animate: boolean) => {
    for (const m of managers) {
      const win = m.win
      if (!win || win.isDestroyed() || event.sender !== win.webContents) continue
      const [w, h] = win.getContentSize()
      const target = Math.max(m.minHeight, Math.min(m.maxHeight, Math.round(contentHeight)))
      if (w === undefined || target === h) return
      win.setResizable(true)
      win.setContentSize(w, target, animate)
      setTimeout(() => {
        if (!win.isDestroyed()) win.setResizable(false)
      }, 300)
      return
    }
  })
}

export interface SettingsWindowOptions {
  /**
   * Load your renderer into the window — e.g. the same bundle on a hash route:
   *   win.loadURL(devServerUrl + '#settings')  /  win.loadFile(html, { hash: 'settings' })
   */
  load: (win: BrowserWindow) => void
  /**
   * Content width in pt; default 460. Size it so no label or checkbox text in
   * your panes ever wraps — native settings panes widen rather than wrap
   * (Finder is 377, Safari's panes are wider).
   */
  width?: number
  /** Initial content height; the renderer then animates the window to fit each pane. */
  height?: number
  /** Clamp for pane-fit heights. Defaults 140 / 700. */
  minHeight?: number
  maxHeight?: number
  /** Extra BrowserWindow options (e.g. webPreferences.preload — see 'electron-cupertino/preload'). */
  windowOptions?: BrowserWindowConstructorOptions
}

export interface SettingsWindowManager {
  /** Open the window, or focus it if already open (singleton, like native Settings). */
  open(): void
  /** Close if open. Call from your main window's 'closed' handler for single-window apps. */
  close(): void
  /** The live window, or null when closed. */
  readonly window: BrowserWindow | null
}

/**
 * A real, separate fixed-size Settings window like Finder/Preview: hidden
 * titlebar with real traffic lights (minimize/zoom disabled), the renderer
 * draws the toolbar-tab chrome (the <SettingsWindow> component or the
 * css/settings.css classes).
 *
 * Also registers the pane-fit resize IPC: when the renderer switches panes it
 * reports the pane's natural height and the window frame animates to fit —
 * `setContentSize(…, animate)` is a no-op on non-resizable windows on macOS,
 * so resizability is enabled just for the animation's duration.
 */
export function createSettingsWindowManager(options: SettingsWindowOptions): SettingsWindowManager {
  const {
    load,
    width = 460,
    height = 320,
    minHeight = 140,
    maxHeight = 700,
    windowOptions = {}
  } = options
  let win: BrowserWindow | null = null

  registerResizeHandler()
  managers.add({
    get win() {
      return win
    },
    minHeight,
    maxHeight
  })

  return {
    open() {
      if (win && !win.isDestroyed()) {
        win.show()
        win.focus()
        return
      }
      win = new BrowserWindow({
        width,
        height,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        show: false,
        titleBarStyle: 'hidden',
        // Matches --in-set-content exactly, so opening the window never
        // flashes a slightly-off gray before the renderer paints.
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#2c2c2e' : '#edeeed',
        ...windowOptions
      })
      // Key-window state, pushed from here rather than sniffed in the
      // renderer: the window is created hidden, so at first mount
      // document.hasFocus() is false and no DOM focus event follows — the
      // pane would open looking unfocused until you clicked away and back.
      // show() makes the window key, which fires 'focus' below, and
      // did-finish-load re-syncs a renderer that reloaded out of band.
      const w = win
      const sendFocus = (): void => {
        if (!w.isDestroyed()) w.webContents.send(IPC_SETTINGS_FOCUS, w.isFocused())
      }
      w.on('focus', sendFocus)
      w.on('blur', sendFocus)
      w.webContents.on('did-finish-load', sendFocus)
      w.on('ready-to-show', () => {
        if (!w.isDestroyed()) w.show()
      })
      w.on('closed', () => {
        win = null
      })
      load(w)
    },
    close() {
      if (win && !win.isDestroyed()) win.close()
    },
    get window() {
      return win
    }
  }
}

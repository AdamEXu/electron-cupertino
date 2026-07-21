/**
 * Preload bridge. Call `exposeCupertino()` from your preload script so the
 * renderer pieces can reach main through contextIsolation:
 *   - the <SettingsWindow> pane-fit animation (resizeSettings)
 *   - key-window state for the chrome-desaturation effect (onSettingsFocus)
 * Safe to omit — renderer features degrade gracefully without it (no height
 * animation; focus falls back to DOM focus/blur events).
 */
import { contextBridge, ipcRenderer } from 'electron'

export interface CupertinoBridge {
  /** Ask main to animate the settings window's content height to fit a pane. */
  resizeSettings(contentHeight: number, animate: boolean): void
  /**
   * Subscribe to key-window state pushed from main (fires on focus, blur, and
   * after load — reliable even though the window is created hidden, where
   * document.hasFocus() lies at mount). Returns an unsubscribe function.
   */
  onSettingsFocus(callback: (focused: boolean) => void): () => void
}

declare global {
  interface Window {
    __cupertino?: CupertinoBridge
  }
}

const IPC_SETTINGS_RESIZE = 'cupertino:settings-resize'
const IPC_SETTINGS_FOCUS = 'cupertino:settings-focus'

export function exposeCupertino(): void {
  const bridge: CupertinoBridge = {
    resizeSettings(contentHeight, animate) {
      void ipcRenderer.invoke(IPC_SETTINGS_RESIZE, contentHeight, animate)
    },
    onSettingsFocus(callback) {
      const listener = (_e: Electron.IpcRendererEvent, focused: boolean): void => callback(focused)
      ipcRenderer.on(IPC_SETTINGS_FOCUS, listener)
      return () => ipcRenderer.removeListener(IPC_SETTINGS_FOCUS, listener)
    }
  }
  contextBridge.exposeInMainWorld('__cupertino', bridge)
}

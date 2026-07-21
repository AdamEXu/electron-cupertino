/**
 * Renderer components. Import from 'electron-cupertino' (requires React 18+) and include
 * the matching CSS: css/tokens.css always, plus css/settings.css for
 * <SettingsWindow>. Non-React apps can use the CSS classes directly.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { symbolGlyph } from './symbols'

export { glyph, hasSymbol, registerSymbols, symbolGlyph, symbolNames } from './symbols'

/** An SF Symbol by name, rendered from the installed SF Pro font. */
export function SFSymbol({
  name,
  className
}: {
  name: string
  className?: string
}): ReactNode {
  return <span className={className ? `sf-symbol ${className}` : 'sf-symbol'}>{symbolGlyph(name)}</span>
}

/**
 * Toggle "in-window-inactive" on <html> as the window gains/loses focus, so
 * the shell/sidebar dimming rules in css/shell.css apply. Returns a cleanup
 * function. Call once at startup (or use the useWindowFocus hook).
 */
export function watchWindowFocus(): () => void {
  const root = document.documentElement
  const sync = (): void => {
    root.classList.toggle('in-window-inactive', !document.hasFocus())
  }
  sync()
  window.addEventListener('focus', sync)
  window.addEventListener('blur', sync)
  return () => {
    window.removeEventListener('focus', sync)
    window.removeEventListener('blur', sync)
    root.classList.remove('in-window-inactive')
  }
}

/** React wrapper for watchWindowFocus(). */
export function useWindowFocus(): void {
  useEffect(() => watchWindowFocus(), [])
}

/* Typed access to the optional preload bridge ('electron-cupertino/preload') without a
   cross-entry ambient declaration. Both members are optional-chained at the
   call sites so older bridges and no bridge at all degrade gracefully. */
interface Bridge {
  resizeSettings?(contentHeight: number, animate: boolean): void
  onSettingsFocus?(callback: (focused: boolean) => void): () => void
}
function getBridge(): Bridge | undefined {
  return (window as { __cupertino?: Bridge }).__cupertino
}

export interface SettingsPane {
  id: string
  /** Tab label, and the window title while the pane is active. */
  label: string
  /** SF Symbol name for the tab icon (e.g. 'gear'). */
  icon: string
  content: ReactNode
}

export interface SettingsWindowProps {
  panes: SettingsPane[]
  /** Defaults to the first pane. */
  initialPaneId?: string
  onPaneChange?: (id: string) => void
}

/**
 * Finder-style Settings window chrome: centered pane title in the titlebar,
 * centered icon-over-label toolbar tabs with a gray pill on the active tab,
 * hairline, then your pane content. Metrics/colors measured off 2x screenshots
 * of Finder/Preview/Messages Settings.
 *
 * Render as the root of the window created by createSettingsWindowManager()
 * ('electron-cupertino/main'). With the preload bridge ('electron-cupertino/preload') exposed, pane
 * switches animate the window height to fit, and losing key-window status
 * desaturates the chrome and strips every accent (the `is-inactive` state in
 * css/settings.css) — both native behaviors. Without the bridge the window
 * keeps its size and focus falls back to DOM events. Esc and ⌘W close the
 * window, like every native settings window.
 */
export function SettingsWindow({
  panes,
  initialPaneId,
  onPaneChange
}: SettingsWindowProps): ReactNode {
  const [paneId, setPaneId] = useState(initialPaneId ?? panes[0]?.id)
  const chromeRef = useRef<HTMLElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)

  const active = panes.find((p) => p.id === paneId) ?? panes[0]

  // Focus tracking — macOS desaturates a window's chrome and drops every
  // accent fill the moment it stops being key. Main owns the truth (via the
  // preload bridge) because this window is created hidden: document.hasFocus()
  // is false while the renderer mounts and no DOM focus event follows the
  // show. The DOM listeners stay as a backstop for focus changes that don't
  // round-trip through main (and are all we have without the bridge).
  const [focused, setFocused] = useState(() => document.hasFocus())
  useEffect(() => {
    const on = (): void => setFocused(true)
    const off = (): void => setFocused(false)
    window.addEventListener('focus', on)
    window.addEventListener('blur', off)
    const unsubscribe = getBridge()?.onSettingsFocus?.(setFocused)
    return () => {
      window.removeEventListener('focus', on)
      window.removeEventListener('blur', off)
      unsubscribe?.()
    }
  }, [])

  // Native pane switch: measure the pane's natural height (chrome + content
  // padding + pane) and ask main to animate the frame there. The very first
  // fit (window open) snaps without animation — native windows open at the
  // right size.
  const firstFit = useRef(true)
  useLayoutEffect(() => {
    const chrome = chromeRef.current
    const pane = paneRef.current
    const bridge = getBridge()
    if (!chrome || !pane || !bridge?.resizeSettings) return
    const content = pane.parentElement
    if (!content) return
    const cs = getComputedStyle(content)
    const target =
      chrome.offsetHeight +
      pane.offsetHeight +
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom)
    bridge.resizeSettings?.(target, !firstFit.current)
    firstFit.current = false
  }, [paneId])

  // Native settings windows close on ⌘W and Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' || (e.metaKey && e.key.toLowerCase() === 'w')) window.close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!active) return null

  const select = (id: string): void => {
    setPaneId(id)
    onPaneChange?.(id)
  }

  return (
    <div className={`in-settings-window${focused ? '' : ' is-inactive'}`}>
      <header ref={chromeRef} className="in-settings-chrome">
        <div className="in-settings-title">{active.label}</div>
        <div className="in-settings-tabs">
          {panes.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`in-settings-tab${p.id === active.id ? ' is-active' : ''}`}
              onClick={() => select(p.id)}
            >
              <span className="in-settings-tab-icon sf-symbol">{symbolGlyph(p.icon)}</span>
              <span className="in-settings-tab-label">{p.label}</span>
            </button>
          ))}
        </div>
      </header>
      <main className="in-settings-content">
        <div ref={paneRef}>{active.content}</div>
      </main>
    </div>
  )
}

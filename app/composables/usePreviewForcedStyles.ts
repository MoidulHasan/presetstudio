import type { InjectionKey, Ref } from 'vue'
import { forcedStateCss, schemeScopeCss } from '~/utils/theme/preview-css'
import type { ColorScheme } from '~/utils/theme/types'

// One <style> in the preview with CSS derived from the theme's own stylesheets:
// - `.ps-show-focus …`: focus styles without focus (focus-states toggle, stage focus cells);
// - `.ps-force-hover …` / `.ps-force-active …`: hover and pressed styles (component stage);
// - `.ps-scheme` / `.ps-scheme.ps-dark`: light and dark areas side by side (component stage).
// Rebuilt whenever component styles are added or the theme changes.

export const FOCUS_CLASS = 'ps-show-focus'
export const HOVER_CLASS = 'ps-force-hover'
export const ACTIVE_CLASS = 'ps-force-active'
export const SCHEME_CLASS = 'ps-scheme'
/** The editor's color scheme, provided by /preview to stages: the one they show. */
export const PREVIEW_SCHEME: InjectionKey<Readonly<Ref<ColorScheme>>> = Symbol('preview-scheme')
/** Whether the editor shows light and dark together ("Both"): stages then draw both. */
export const PREVIEW_BOTH: InjectionKey<Readonly<Ref<boolean>>> = Symbol('preview-both')
const DARK_CLASS = 'ps-dark'

export function usePreviewForcedStyles() {
  let style: HTMLStyleElement | null = null
  let observer: MutationObserver | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let options = { focus: false, stage: false }

  function build() {
    if (!style) return
    const sources = Array.from(document.querySelectorAll('style'))
      .filter(el => el !== style)
      .map(el => el.textContent ?? '')
    const parts: string[] = []
    for (const css of sources) {
      if (options.focus || options.stage) parts.push(forcedStateCss(css, `.${FOCUS_CLASS}`, 'focus'))
      if (options.stage) {
        parts.push(forcedStateCss(css, `.${HOVER_CLASS}`, 'hover'))
        parts.push(forcedStateCss(css, `.${ACTIVE_CLASS}`, 'active'))
      }
    }
    if (options.stage) parts.push(schemeScopeCss(sources, `.${SCHEME_CLASS}`, DARK_CLASS))
    const css = parts.filter(Boolean).join('\n')
    if (style.textContent !== css) style.textContent = css
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(build, 50)
  }

  function update(next: { focus: boolean, stage: boolean }) {
    const changed = next.focus !== options.focus || next.stage !== options.stage
    options = next
    document.documentElement.classList.toggle(FOCUS_CLASS, next.focus)
    const on = next.focus || next.stage
    if (on && !style) {
      style = document.createElement('style')
      style.dataset.psForcedStyles = ''
      document.head.appendChild(style)
      observer = new MutationObserver((records) => {
        if (records.every(r => r.target === style)) return
        schedule()
      })
      observer.observe(document.head, { childList: true, subtree: true, characterData: true })
      build()
    }
    else if (!on && style) {
      dispose()
    }
    else if (changed) {
      build()
    }
  }

  function dispose() {
    observer?.disconnect()
    style?.remove()
    style = null
    observer = null
    clearTimeout(timer)
  }

  return { update, dispose }
}

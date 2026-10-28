import { COMPONENT_META } from '~/utils/theme/components'
import { nestedComponent } from './usePreviewInspector'

// Preview side of the spotlight ("In an app"): the components a section changes stay as they are,
// every other component is dimmed, so it's clear what the section reaches. Components are found
// by PrimeVue's data-pc-name; nested parts ('pcbutton' in a paginator) count as their component.
// Containers (Card, Panel, Tabs…) are never dimmed as a whole, only the components in them: they
// also hold plain content (a chart in the primary color) that the section may well change.

const STYLE = `
html.ps-spotlight [data-pc-name]:not([data-ps-lit]):not([data-ps-frame]):not(:has([data-ps-lit])):not([data-ps-lit] *) {
  opacity: 0.28; filter: saturate(0.3); transition: opacity 200ms, filter 200ms;
}
@media (prefers-reduced-motion: reduce) { html.ps-spotlight [data-pc-name] { transition: none !important; } }
`

function componentName(el: HTMLElement): string | null {
  const name = el.dataset.pcName?.toLowerCase()
  if (!name) return null
  return name.startsWith('pc') ? nestedComponent(name) : name
}

export function usePreviewSpotlight() {
  let lit: Set<string> | null = null
  let style: HTMLStyleElement | null = null
  let observer: MutationObserver | null = null
  let frame = 0

  function mark() {
    for (const el of document.querySelectorAll<HTMLElement>('[data-pc-name]')) {
      const name = componentName(el)
      el.toggleAttribute('data-ps-lit', !!lit && !!name && lit.has(name))
      el.toggleAttribute('data-ps-frame', !!name && COMPONENT_META[name]?.category === 'panel')
    }
    // A component that renders on demand (Dialog, Popover, Toast…) isn't on the page until it's
    // opened: its gallery demo stays lit instead, with the buttons that open it.
    for (const demo of document.querySelectorAll<HTMLElement>('[data-ps-demo]')) {
      const names = demo.dataset.psDemo?.split(' ') ?? []
      const onDemand = !!lit && names.some(name => lit!.has(name)) && !demo.querySelector('[data-pc-name][data-ps-lit]')
      demo.toggleAttribute('data-ps-lit', onDemand)
    }
  }

  // Pages render in parts (lazy gallery sections, overlays): mark what appears.
  function schedule() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(mark)
  }

  /** Components to keep lit; null or empty turns the spotlight off. */
  function set(components: string[] | null) {
    lit = components?.length ? new Set(components) : null
    if (lit && !style) {
      style = document.createElement('style')
      style.textContent = STYLE
      document.head.appendChild(style)
    }
    document.documentElement.classList.toggle('ps-spotlight', !!lit)
    mark()
    if (lit && !observer) {
      observer = new MutationObserver(schedule)
      observer.observe(document.body, { childList: true, subtree: true })
    }
    else if (!lit) {
      observer?.disconnect()
      observer = null
    }
  }

  function dispose() {
    set(null)
    cancelAnimationFrame(frame)
    style?.remove()
    style = null
  }

  return { set, dispose }
}

import { COMPONENT_META, isComponentName } from '~/utils/theme/components'
import { CATEGORY_META } from '~/utils/preview-categories'

// Preview-side component inspection. PrimeVue marks every component root with
// `data-pc-name` ('button', 'datatable', 'accordionpanel', …); the nearest one that's a
// themed component (a key of the preset's `components`) is what a click or reveal targets.

const HIGHLIGHT = '#2563eb'

/** Nearest themed component around `start` (sub-parts like 'accordionpanel' are skipped). */
function componentAt(start: Element | null): { element: HTMLElement, name: string } | null {
  let el: Element | null = start
  while (el) {
    const host: HTMLElement | null = el.closest('[data-pc-name]')
    if (!host) return null
    const name = host.dataset.pcName?.toLowerCase()
    if (isComponentName(name)) return { element: host, name }
    el = host.parentElement
  }
  return null
}

/** With Alt held, the component around the nearest one (a Button inside a DataTable → the DataTable). */
function pickAt(start: Element | null, outer: boolean): { element: HTMLElement, name: string, around: string | null } | null {
  const inner = componentAt(start)
  if (!inner) return null
  const parent = componentAt(inner.element.parentElement)
  if (outer && parent) return { ...parent, around: null }
  return { ...inner, around: parent?.name ?? null }
}

const ALT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌥' : 'Alt'

function firstVisible(selector: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

/** The component itself or, for ones that render on demand (Dialog, Tooltip, …), its gallery demo. */
function findComponent(name: string): HTMLElement | null {
  return firstVisible(`[data-pc-name="${name}"]`) ?? firstVisible(`[data-ps-demo~="${name}"]`)
}

// Nested components carry a 'pc' name ('pcbutton', 'pcrowperpagedropdown', …). PrimeVue 4
// calls Select 'dropdown' internally and SpeedDial's items 'action'.
const NESTED_ALIASES: Record<string, string> = { dropdown: 'select', action: 'button' }
const NAMES_BY_LENGTH = Object.keys(COMPONENT_META).sort((a, b) => b.length - a.length)

function nestedComponent(pcName: string): string | null {
  const name = pcName.slice(2)
  if (Object.hasOwn(COMPONENT_META, name)) return name
  const alias = Object.keys(NESTED_ALIASES).find(key => name.endsWith(key))
  if (alias) return NESTED_ALIASES[alias]!
  // 'pcmoveupbutton' → 'button', 'pcrowcheckbox' → 'checkbox' (longest match wins).
  return NAMES_BY_LENGTH.find(candidate => name.endsWith(candidate)) ?? null
}

/** Other components a component is built from (their tokens style those parts). */
function usedBy(element: HTMLElement, name: string): string[] {
  const uses = new Set<string>()
  for (const el of element.querySelectorAll<HTMLElement>('[data-pc-name^="pc"]')) {
    const nested = nestedComponent(el.dataset.pcName!.toLowerCase())
    if (nested && nested !== name) uses.add(nested)
  }
  return [...uses].sort()
}

export function usePreviewInspector(onPick: (component: string) => void) {
  // One absolutely positioned box (outside the themed UI) for hover and reveal highlights.
  let box: HTMLDivElement | null = null
  let tag: HTMLSpanElement | null = null
  let hideTimer: ReturnType<typeof setTimeout> | undefined
  let inspecting = false

  function ensureBox() {
    if (box) return box
    box = document.createElement('div')
    box.setAttribute('aria-hidden', 'true')
    Object.assign(box.style, {
      position: 'fixed', zIndex: '2147483647', pointerEvents: 'none', display: 'none',
      border: `2px solid ${HIGHLIGHT}`, background: 'rgba(37, 99, 235, 0.08)', borderRadius: '4px',
      transition: 'top 80ms, left 80ms, width 80ms, height 80ms',
    } satisfies Partial<CSSStyleDeclaration>)
    tag = document.createElement('span')
    Object.assign(tag.style, {
      position: 'absolute', left: '-2px', bottom: '100%', marginBottom: '2px', padding: '1px 6px',
      background: HIGHLIGHT, color: '#fff', font: '600 11px/16px system-ui, sans-serif', borderRadius: '3px', whiteSpace: 'nowrap',
    } satisfies Partial<CSSStyleDeclaration>)
    box.appendChild(tag)
    document.body.appendChild(box)
    return box
  }

  function highlight(element: HTMLElement | null, name = '', around: string | null = null) {
    const el = ensureBox()
    if (!element) {
      el.style.display = 'none'
      return
    }
    const r = element.getBoundingClientRect()
    Object.assign(el.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
    if (tag) {
      const label = (key: string) => COMPONENT_META[key]?.label ?? key
      // While picking, say how to reach the component around this one.
      tag.textContent = around ? `${label(name)}  ·  ${ALT}-click: ${label(around)}` : label(name)
      // Keep the label on screen for components at the very top.
      tag.style.bottom = r.top < 20 ? 'auto' : '100%'
      tag.style.top = r.top < 20 ? '100%' : 'auto'
    }
  }

  // --- Inspect mode ----------------------------------------------------------------------
  let hovered: HTMLElement | null = null
  // Last pointer position: scrolling moves the page under a still pointer.
  let pointer: { x: number, y: number } | null = null
  let alt = false

  function hover(target: Element | null) {
    const hit = pickAt(target, alt)
    hovered = hit?.element ?? null
    highlight(hovered, hit?.name, hit?.around)
  }

  function onMove(event: PointerEvent) {
    pointer = { x: event.clientX, y: event.clientY }
    alt = event.altKey
    hover(event.target as Element)
  }

  // Pressing or releasing Alt switches between the component and the one around it.
  function onAltKey(event: KeyboardEvent) {
    if (event.key !== 'Alt' || alt === (event.type === 'keydown')) return
    event.preventDefault()
    alt = event.type === 'keydown'
    if (pointer) hover(document.elementFromPoint(pointer.x, pointer.y))
  }

  // Swallow interaction so clicking a button or opening a dropdown doesn't happen while picking.
  function block(event: Event) {
    event.preventDefault()
    event.stopPropagation()
  }

  function onClick(event: MouseEvent) {
    block(event)
    const hit = pickAt(event.target as Element, event.altKey)
    if (hit) onPick(hit.name)
  }

  // After a scroll, highlight what's under the pointer now (the box ignores pointer events).
  function onScrollOrResize() {
    if (pointer) hover(document.elementFromPoint(pointer.x, pointer.y))
    else if (hovered) highlight(hovered, componentAt(hovered)?.name)
  }

  const BLOCKED = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'contextmenu'] as const

  function setInspect(on: boolean) {
    if (on === inspecting) return
    inspecting = on
    document.documentElement.classList.toggle('ps-inspecting', on)
    const method = on ? 'addEventListener' : 'removeEventListener'
    window[method]('pointermove', onMove as EventListener, true)
    window[method]('click', onClick as EventListener, true)
    window[method]('scroll', onScrollOrResize, true)
    window[method]('keydown', onAltKey as EventListener, true)
    window[method]('keyup', onAltKey as EventListener, true)
    for (const type of BLOCKED) window[method](type, block, true)
    if (!on) {
      hovered = null
      pointer = null
      alt = false
      highlight(null)
    }
  }

  // --- Reveal ----------------------------------------------------------------------------
  let revealRun = 0

  /** Scrolls a component into view and flashes it. Resolves whether it was found and what it's built from. */
  async function reveal(name: string): Promise<{ found: boolean, uses: string[] }> {
    const run = ++revealRun
    // The component may still be rendering (category switch, lazy "All" sections).
    for (let attempt = 0; attempt < 25; attempt++) {
      if (run !== revealRun) return { found: false, uses: [] }
      const element = findComponent(name)
      if (element) {
        element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
        highlight(element, name)
        clearTimeout(hideTimer)
        hideTimer = setTimeout(() => {
          if (!inspecting) highlight(null)
        }, 1400)
        return { found: true, uses: usedBy(element, name) }
      }
      // In the "All" gallery, scroll the component's category into view so it loads.
      const meta = COMPONENT_META[name]
      const section = meta && document.querySelector(`section[aria-label="${CATEGORY_META[meta.category].label} components"]`)
      section?.scrollIntoView({ block: 'start', behavior: 'instant' })
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    return { found: false, uses: [] }
  }

  function dispose() {
    setInspect(false)
    clearTimeout(hideTimer)
    box?.remove()
    box = null
  }

  return { setInspect, reveal, dispose }
}

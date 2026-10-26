import { stageTargetMatches } from '~/utils/stage-targets'
import type { HighlightMode } from '~/utils/theme/messages'

// Preview side of "point at a control, see it here": outlines over the stage elements a control
// in the editor edits (matched on their `data-ps-pick` target), held while the control is hovered
// or focused, and a short pulse when its value changes. Same blue as Pick's hover box.

const COLOR = '#2563eb'
const PULSE_MS = 800
const STYLE = `
.ps-hl { position: fixed; pointer-events: none; border-radius: 6px; outline: 2px solid ${COLOR}; outline-offset: 2px; background: rgba(37, 99, 235, 0.06); transition: top 80ms, left 80ms, width 80ms, height 80ms; }
.ps-hl-pulse { animation: ps-hl-pulse ${PULSE_MS}ms ease-out forwards; background: transparent; }
@keyframes ps-hl-pulse { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.55); opacity: 1; } 70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); opacity: 1; } 100% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ps-hl { transition: none; } .ps-hl-pulse { animation-duration: 1ms; animation-delay: ${PULSE_MS}ms; box-shadow: none; } }
`

/** Matching stage elements, outermost only (a matched cell inside a matched row adds nothing). */
function matches(pattern: string): HTMLElement[] {
  const all = [...document.querySelectorAll<HTMLElement>('[data-ps-pick]')]
    .filter(el => stageTargetMatches(pattern, el.dataset.psPick ?? '') && el.getClientRects().length > 0)
  return all.filter(el => !all.some(other => other !== el && other.contains(el)))
}

export function usePreviewHighlight() {
  let layer: HTMLDivElement | null = null
  let steady: { pattern: string, boxes: HTMLDivElement[] } | null = null
  let frame = 0

  function ensureLayer() {
    if (layer) return layer
    const style = document.createElement('style')
    style.textContent = STYLE
    document.head.appendChild(style)
    layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483646' })
    document.body.appendChild(layer)
    return layer
  }

  function place(box: HTMLDivElement, el: HTMLElement) {
    const r = el.getBoundingClientRect()
    Object.assign(box.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  }

  function boxesFor(elements: HTMLElement[], cls: string) {
    const parent = ensureLayer()
    return elements.map((el) => {
      const box = document.createElement('div')
      box.className = cls
      place(box, el)
      parent.appendChild(box)
      return box
    })
  }

  // While outlines show, follow their elements (scrolling, layout changes from a theme update).
  function follow() {
    cancelAnimationFrame(frame)
    if (!steady) return
    const elements = matches(steady.pattern)
    if (elements.length !== steady.boxes.length) {
      steady.boxes.forEach(b => b.remove())
      steady.boxes = boxesFor(elements, 'ps-hl')
    }
    else elements.forEach((el, i) => place(steady!.boxes[i]!, el))
    frame = requestAnimationFrame(follow)
  }

  function clear() {
    cancelAnimationFrame(frame)
    steady?.boxes.forEach(b => b.remove())
    steady = null
  }

  /** Outlines what `pattern` points at (null clears); 'focus' also scrolls it into view. */
  function show(pattern: string | null, mode: HighlightMode) {
    if (mode === 'pulse') {
      if (!pattern) return
      const boxes = boxesFor(matches(pattern), 'ps-hl ps-hl-pulse')
      setTimeout(() => boxes.forEach(b => b.remove()), PULSE_MS + 50)
      return
    }
    clear()
    if (!pattern) return
    const elements = matches(pattern)
    if (!elements.length) return
    if (mode === 'focus') {
      const r = elements[0]!.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) elements[0]!.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    steady = { pattern, boxes: boxesFor(elements, 'ps-hl') }
    follow()
  }

  function dispose() {
    clear()
    layer?.remove()
    layer = null
  }

  return { show, dispose }
}

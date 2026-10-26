import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'

const HOVER_DELAY = 60
/** A change this soon after using a control is that control's change (drags in popovers too). */
const RECENT_MS = 3000
const PULSE_EVERY = 700
/** Lets the preview apply the change first, so the pulse shows the new value. */
const PULSE_DELAY = 120

/**
 * Points the preview at what the panel's controls edit. A control, or a block of them, carries
 * `data-stage-target` with a target pattern (stage-targets.ts): hovering or focusing it outlines
 * those elements on the stage, and a change made with it makes them pulse. The reverse, clicking
 * the stage to open a control, is `useStagePick`.
 */
export function useStageTargets(root: Ref<HTMLElement | null>) {
  const editor = useEditorStore()
  const workspace = useWorkspaceStore()

  let hovered: string | null = null
  let focused: string | null = null
  let used: { target: string, at: number } | null = null
  let hoverTimer: ReturnType<typeof setTimeout> | undefined
  let pulseTimer: ReturnType<typeof setTimeout> | undefined
  let lastPulse = 0

  const targetOf = (node: EventTarget | null) =>
    node instanceof Element ? node.closest<HTMLElement>('[data-stage-target]')?.dataset.stageTarget ?? null : null

  function point() {
    editor.pointAtStage(hovered ?? focused, hovered ? 'hover' : 'focus')
  }

  function onPointerOver(event: PointerEvent) {
    const target = targetOf(event.target)
    if (target === hovered) return
    hovered = target
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(point, HOVER_DELAY)
  }

  function onPointerLeave() {
    clearTimeout(hoverTimer)
    if (hovered === null) return
    hovered = null
    point()
  }

  function onFocusIn(event: FocusEvent) {
    focused = targetOf(event.target)
    // Keyboard focus also scrolls the stage to it ('focus'); hover only outlines.
    if (!hovered) point()
  }

  function onFocusOut(event: FocusEvent) {
    if (root.value?.contains(event.relatedTarget as Node | null)) return
    focused = null
    if (!hovered) point()
  }

  function onUse(event: Event) {
    const target = targetOf(event.target)
    if (target) used = { target, at: Date.now() }
  }

  watch(() => workspace.theme, () => {
    const target = used && Date.now() - used.at < RECENT_MS ? used.target : null
    if (!target || Date.now() - lastPulse < PULSE_EVERY) return
    used = { target, at: Date.now() }
    lastPulse = Date.now()
    clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => editor.pointAtStage(target, 'pulse'), PULSE_DELAY)
  })

  const USE_EVENTS = ['pointerdown', 'input', 'change', 'keydown'] as const
  watch(root, (el, previous) => {
    for (const [node, method] of [[previous, 'removeEventListener'], [el, 'addEventListener']] as const) {
      if (!node) continue
      node[method]('pointerover', onPointerOver as EventListener)
      node[method]('pointerleave', onPointerLeave)
      node[method]('focusin', onFocusIn as EventListener)
      node[method]('focusout', onFocusOut as EventListener)
      for (const type of USE_EVENTS) node[method](type, onUse, true)
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    clearTimeout(hoverTimer)
    clearTimeout(pulseTimer)
    if (hovered || focused) editor.pointAtStage(null, 'hover')
  })
}

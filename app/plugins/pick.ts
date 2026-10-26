import type { Directive } from 'vue'

/** Event a picked stage element sends up to /preview (detail: the target, e.g. 'root:danger:hover'). */
export const PICK_EVENT = 'ps-pick'

function onClick(this: HTMLElement, event: Event) {
  // The innermost picked element wins (a cell inside a picked row reports the cell).
  event.stopPropagation()
  this.dispatchEvent(new CustomEvent(PICK_EVENT, { bubbles: true, detail: this.dataset.psPick }))
}

/**
 * `v-pick="'root:danger:hover'"` on a stage element: tags it with what it edits (`data-ps-pick`),
 * so the editor can point at it, and reports clicks on it, so a click opens that control.
 */
const vPick: Directive<HTMLElement, string> = {
  mounted(el, { value }) {
    el.dataset.psPick = value
    el.addEventListener('click', onClick)
  },
  updated(el, { value }) {
    el.dataset.psPick = value
  },
  unmounted(el) {
    el.removeEventListener('click', onClick)
  },
  getSSRProps: ({ value }) => ({ 'data-ps-pick': value }),
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('pick', vPick)
})

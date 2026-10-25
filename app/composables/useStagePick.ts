import { useEditorStore } from '~/stores/editor'

/**
 * Handles clicks on the preview stage ('root:danger:hover', split on ':'). Each pick is handled
 * once, by the editor that's mounted, after the DOM has updated: the editor may mount right
 * after the pick (opening SplitButton picks its section of the Button editor).
 */
export function useStagePick(handle: (parts: string[]) => unknown) {
  const store = useEditorStore()
  watch(() => store.stagePick, async (pick) => {
    if (!pick) return
    store.stagePick = null
    await nextTick()
    await handle(pick.target.split(':'))
  }, { immediate: true })
}

/**
 * A short highlight on what a stage click selected. A new flash replaces the previous one, and
 * the timer is cleared on unmount.
 */
export function useFlash<T>(duration = 1600) {
  const current = shallowRef<T | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function flash(value: T) {
    clearTimeout(timer)
    current.value = value
    timer = setTimeout(() => (current.value = null), duration)
  }
  onBeforeUnmount(() => clearTimeout(timer))
  return { current, flash }
}

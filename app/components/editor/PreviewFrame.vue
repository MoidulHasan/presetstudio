<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { createApplyMessage, createRevealMessage, createScrollToMessage, parsePreviewMessage, type ScrollPosition } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

const props = defineProps<{ colorScheme: ColorScheme, label: string, hideScrollbar?: boolean }>()
const emit = defineEmits<{ scroll: [position: ScrollPosition] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const frame = ref<HTMLIFrameElement | null>(null)
const ready = ref(false)

// Applying a theme restyles the whole preview (every CSS variable changes), so during a drag
// it's updated at most ~30 times a second: the first change goes out on the next frame, later
// ones are coalesced, and the last one always arrives.
const MIN_INTERVAL = 33
let pending = 0
let timer: ReturnType<typeof setTimeout> | undefined
let lastSent = -Infinity
let scheduled = false

function postState() {
  scheduled = false
  const target = frame.value?.contentWindow
  if (!ready.value || !target) return
  lastSent = performance.now()
  // While Compare is held, the open editor's own edits are left out.
  const state = editor.prefs.compare ? { ...workspace.theme, overrides: editor.compareOverrides() } : workspace.theme
  target.postMessage(createApplyMessage(state, props.colorScheme, {
    template: editor.prefs.template,
    category: editor.prefs.category,
    hideScrollbar: props.hideScrollbar,
    showFocus: editor.prefs.showFocus,
    inspect: editor.prefs.inspect,
    stage: editor.activeStage,
    bothSchemes: editor.prefs.split,
  }), window.location.origin)
}

function sendState() {
  if (!ready.value) return
  cancelAnimationFrame(pending)
  clearTimeout(timer)
  scheduled = true
  const wait = lastSent + MIN_INTERVAL - performance.now()
  const schedule = () => (pending = requestAnimationFrame(postState))
  if (wait > 0) timer = setTimeout(schedule, wait)
  else schedule()
}

/** Sends a scheduled state now (messages that depend on it, like a reveal, must come after). */
function flushState() {
  if (!scheduled) return
  cancelAnimationFrame(pending)
  clearTimeout(timer)
  postState()
}

function onMessage(event: MessageEvent) {
  if (event.source !== frame.value?.contentWindow) return
  const message = parsePreviewMessage(event, window.location.origin)
  if (message?.type === 'preview:ready') {
    // Also fires again whenever the iframe reloads.
    ready.value = true
    sendState()
  }
  else if (message?.type === 'preview:scroll') {
    emit('scroll', { x: message.x, y: message.y })
  }
  else if (message?.type === 'preview:inspect') {
    // One pick per Inspect click, like browser dev tools.
    editor.prefs.inspect = false
    editor.openComponent(message.component)
    // On narrow screens the picked component's tokens are in the other pane.
    editor.prefs.pane = 'edit'
  }
  else if (message?.type === 'preview:shortcut') {
    if (message.shortcut === 'undo') workspace.undo()
    else if (message.shortcut === 'redo') workspace.redo()
    else if (message.shortcut === 'stop-pick') editor.prefs.inspect = false
    // The top bar opens search on ⌘K / Ctrl+K.
    else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }
  else if (message?.type === 'preview:stage-pick') {
    editor.pickOnStage(message.target)
    editor.prefs.pane = 'edit'
  }
  else if (message?.type === 'preview:revealed') {
    editor.reportRevealed(message.component, message.found, message.uses)
  }
}

// Sent after the pending state message, so a category switch is applied before the reveal.
watch(() => editor.revealRequest, (request) => {
  const target = frame.value?.contentWindow
  if (!request || !ready.value || !target) return
  requestAnimationFrame(() => requestAnimationFrame(() => {
    flushState()
    target.postMessage(createRevealMessage(request.component), window.location.origin)
  }))
})

/** Scrolls the preview without it reporting the scroll back (used to sync panes). */
function scrollTo(position: ScrollPosition) {
  if (ready.value) frame.value?.contentWindow?.postMessage(createScrollToMessage(position), window.location.origin)
}

defineExpose({ scrollTo })

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  cancelAnimationFrame(pending)
  clearTimeout(timer)
})

watch([() => workspace.theme, () => props.colorScheme, () => editor.prefs.template, () => editor.prefs.category, () => props.hideScrollbar, () => editor.prefs.showFocus, () => editor.prefs.inspect, () => editor.activeStage, () => editor.prefs.compare, () => editor.prefs.split], sendState)
</script>

<template>
  <div class="relative h-full w-full">
    <iframe
      ref="frame"
      src="/preview"
      :title="props.label"
      class="h-full w-full border-0"
    />
    <div
      v-if="!ready"
      class="absolute inset-0 grid place-items-center bg-surface-50 dark:bg-surface-950"
    >
      <ProgressSpinner
        style="width: 2.5rem; height: 2.5rem"
        aria-label="Loading preview"
      />
    </div>
  </div>
</template>

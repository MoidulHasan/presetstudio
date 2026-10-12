<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { createApplyMessage, createScrollToMessage, parsePreviewMessage, type ScrollPosition } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

const props = defineProps<{ colorScheme: ColorScheme, label: string, hideScrollbar?: boolean }>()
const emit = defineEmits<{ scroll: [position: ScrollPosition] }>()

const store = useEditorStore()
const frame = ref<HTMLIFrameElement | null>(null)
const ready = ref(false)

let pending = 0
function sendState() {
  const target = frame.value?.contentWindow
  if (!ready.value || !target) return
  // Coalesce rapid changes (e.g. dragging the color picker) into one message per frame.
  cancelAnimationFrame(pending)
  pending = requestAnimationFrame(() => {
    target.postMessage(createApplyMessage(store.theme, props.colorScheme, {
      template: store.prefs.template,
      category: store.prefs.category,
      hideScrollbar: props.hideScrollbar,
    }), window.location.origin)
  })
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
}

/** Scrolls the preview without it reporting the scroll back (used to sync panes). */
function scrollTo(position: ScrollPosition) {
  if (ready.value) frame.value?.contentWindow?.postMessage(createScrollToMessage(position), window.location.origin)
}

defineExpose({ scrollTo })

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  cancelAnimationFrame(pending)
})

watch([() => store.theme, () => props.colorScheme, () => store.prefs.template, () => store.prefs.category, () => props.hideScrollbar], sendState)
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

<script setup lang="ts">
import { useEditorStore, type PreviewViewport } from '~/stores/editor'
import type { ScrollPosition } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

// The preview area: one frame or light/dark side by side, at the chosen viewport width.
// Scheme-aware inspector panels have their own light/dark switch for what to edit.
const store = useEditorStore()

const VIEWPORT_WIDTH: Record<PreviewViewport, string | null> = { full: null, tablet: '768px', mobile: '390px' }

const panes = computed<ColorScheme[]>(() => (store.prefs.split ? ['light', 'dark'] : [store.prefs.colorScheme]))
const width = computed(() => VIEWPORT_WIDTH[store.prefs.viewport])

// Side by side, both panes scroll together so the same component is always compared.
type FrameHandle = { scrollTo: (position: ScrollPosition) => void }
const frames: Record<ColorScheme, FrameHandle | null> = { light: null, dark: null }

function setFrame(scheme: ColorScheme, handle: unknown) {
  frames[scheme] = (handle as FrameHandle | null) ?? null
}

function onScroll(from: ColorScheme, position: ScrollPosition) {
  if (!store.prefs.split) return
  frames[from === 'light' ? 'dark' : 'light']?.scrollTo(position)
}
</script>

<template>
  <div
    class="grid min-h-0 flex-1 gap-px bg-surface-200 dark:bg-surface-800"
    :class="store.prefs.split ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'"
  >
    <div
      v-for="scheme in panes"
      :key="scheme"
      class="flex min-h-0 min-w-0 flex-col bg-surface-100 dark:bg-surface-950"
    >
      <div
        class="flex min-h-0 flex-1 justify-center overflow-auto"
        :class="width ? 'p-4' : ''"
      >
        <div
          class="min-h-0 w-full transition-[max-width] duration-200"
          :class="width ? 'overflow-hidden rounded-xl border border-surface-300 shadow-lg dark:border-surface-700' : ''"
          :style="width ? { maxWidth: width } : undefined"
        >
          <EditorPreviewFrame
            :ref="handle => setFrame(scheme, handle)"
            :color-scheme="scheme"
            :label="`${scheme} mode preview`"
            @scroll="position => onScroll(scheme, position)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

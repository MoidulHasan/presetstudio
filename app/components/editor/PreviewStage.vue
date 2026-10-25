<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { PreviewViewport } from '~/utils/editor-sections'
import type { ScrollPosition } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

// The preview area: one frame or light/dark side by side, at the chosen viewport width.
// Scheme-aware inspector panels have their own light/dark switch for what to edit.
const editor = useEditorStore()

const VIEWPORT_WIDTH: Record<PreviewViewport, string | null> = { full: null, tablet: '768px', mobile: '390px' }

// A component stage shows light and dark itself, so it needs one pane.
const split = computed(() => editor.prefs.split && !editor.activeStage)
const panes = computed<ColorScheme[]>(() => (split.value ? ['light', 'dark'] : [editor.prefs.colorScheme]))
const width = computed(() => VIEWPORT_WIDTH[editor.prefs.viewport])

// Side by side, both panes scroll together so the same component is always compared.
type FrameHandle = { scrollTo: (position: ScrollPosition) => void }
const frames: Record<ColorScheme, FrameHandle | null> = { light: null, dark: null }

function setFrame(scheme: ColorScheme, handle: unknown) {
  frames[scheme] = (handle as FrameHandle | null) ?? null
}

const alt = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌥' : 'Alt'

function onScroll(from: ColorScheme, position: ScrollPosition) {
  if (!split.value) return
  frames[from === 'light' ? 'dark' : 'light']?.scrollTo(position)
}
</script>

<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <!-- While picking: what a click does, and the way out. -->
    <div
      v-if="editor.prefs.inspect"
      class="flex shrink-0 items-center gap-3 border-b border-primary-200 bg-primary-50 px-3 py-1.5 text-sm dark:border-primary-900 dark:bg-primary-950"
      role="status"
    >
      <i
        class="pi pi-bullseye text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1">
        Click a component to edit it.
        <span class="text-surface-600 max-md:hidden dark:text-surface-400">{{ alt }}-click picks the one around it. Esc stops.</span>
      </span>
      <Button
        label="Stop picking"
        severity="secondary"
        size="small"
        text
        @click="editor.prefs.inspect = false"
      />
    </div>
    <div
      class="grid min-h-0 flex-1 gap-px bg-surface-200 dark:bg-surface-800"
      :class="split ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'"
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
              :hide-scrollbar="split && scheme === 'light'"
              @scroll="position => onScroll(scheme, position)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

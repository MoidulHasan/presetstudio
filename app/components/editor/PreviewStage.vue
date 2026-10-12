<script setup lang="ts">
import { useEditorStore, type PreviewViewport } from '~/stores/editor'
import type { ColorScheme } from '~/utils/theme/types'

// The preview area: one frame or light/dark side by side, at the chosen viewport width.
const store = useEditorStore()

const VIEWPORT_WIDTH: Record<PreviewViewport, string | null> = { full: null, tablet: '768px', mobile: '390px' }

const panes = computed<ColorScheme[]>(() => (store.prefs.split ? ['light', 'dark'] : [store.prefs.colorScheme]))
const width = computed(() => VIEWPORT_WIDTH[store.prefs.viewport])
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
      <Button
        v-if="store.prefs.split"
        :icon="scheme === 'light' ? 'pi pi-sun' : 'pi pi-moon'"
        :label="scheme === 'light' ? 'Light' : 'Dark'"
        :badge="store.prefs.colorScheme === scheme ? 'editing' : undefined"
        badge-severity="secondary"
        severity="secondary"
        size="small"
        text
        class="!h-8 shrink-0 !justify-start !rounded-none !bg-surface-0 !px-3 dark:!bg-surface-900"
        :class="store.prefs.colorScheme === scheme ? '!font-semibold' : ''"
        :aria-pressed="store.prefs.colorScheme === scheme"
        :aria-label="`Edit ${scheme} mode`"
        @click="store.prefs.colorScheme = scheme"
      />
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
            :color-scheme="scheme"
            :label="`${scheme} mode preview`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { useWorkspaceStore } from '~/stores/workspace'
import { SECTION_META, type EditorSection } from '~/utils/editor-sections'
import { listChanges, revertChange, type ChangeArea, type ThemeChange } from '~/utils/theme/changes'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'

// Review → What you changed: every difference from the base preset in plain words, each one
// openable where it's edited and revertible on its own.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()
const undoHint = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'

const changes = computed(() => listChanges(workspace.theme))
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

const AREAS: Array<{ key: ChangeArea, label: string }> = [
  { key: 'look', label: 'Look & feel' },
  { key: 'shared', label: 'Shared styles' },
  { key: 'components', label: 'Components' },
  { key: 'tokens', label: 'Tokens' },
]
const groups = computed(() => AREAS
  .map(area => ({ ...area, items: changes.value.filter(c => c.area === area.key) }))
  .filter(g => g.items.length))

/** Shared styles are named like their section in the navigation. */
function labelOf(change: ThemeChange): string {
  const section = change.target && 'section' in change.target ? change.target.section as EditorSection : null
  return change.area === 'shared' && section && SECTION_META[section] ? SECTION_META[section].label : change.label
}

function show(change: ThemeChange) {
  if (!change.target) return
  if ('component' in change.target) editor.openComponent(change.target.component)
  else editor.openSection(change.target.section as EditorSection)
}

function revert(change: ThemeChange) {
  workspace.update(d => Object.assign(d, revertChange(d, change.id)))
  toast.add({ severity: 'secondary', summary: `${labelOf(change)} reverted`, detail: `Press ${undoHint} to undo.`, life: 3000 })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Summary first: how much changed, and whether contrast still holds. -->
    <div class="flex flex-col gap-2 rounded-lg bg-surface-50 p-4 dark:bg-surface-800">
      <p class="text-sm">
        <span class="font-semibold">{{ changes.length }} change{{ changes.length === 1 ? '' : 's' }}</span>
        on top of {{ baseLabel }}.
      </p>
      <p
        v-if="!preset.contrastIssues"
        class="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400"
      >
        <i
          class="pi pi-check-circle text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
        No new contrast issues.
      </p>
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <span class="flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-400">
          <i
            class="pi pi-exclamation-triangle"
            aria-hidden="true"
          />
          {{ preset.contrastIssues }} contrast issue{{ preset.contrastIssues === 1 ? '' : 's' }} introduced
        </span>
        <Button
          label="Review contrast"
          icon="pi pi-arrow-right"
          icon-pos="right"
          size="small"
          text
          class="!p-0"
          @click="editor.openSection('accessibility')"
        />
      </div>
    </div>

    <!-- Nothing changed yet: point at where to start. -->
    <div
      v-if="!changes.length"
      class="flex flex-col items-center gap-3 py-8 text-center"
    >
      <i
        class="pi pi-sparkles text-2xl text-surface-400"
        aria-hidden="true"
      />
      <p class="text-sm font-medium">
        No changes yet
      </p>
      <p class="max-w-64 text-xs text-surface-500 dark:text-surface-400">
        This theme is {{ baseLabel }} as it comes. Start with Brand to pick your look and color.
      </p>
      <Button
        label="Go to Brand"
        icon="pi pi-bolt"
        size="small"
        @click="editor.openSection('start')"
      />
    </div>

    <section
      v-for="group in groups"
      :key="group.key"
      :aria-label="group.label"
      class="flex flex-col gap-1"
    >
      <h3 class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
        {{ group.label }}
      </h3>
      <ul class="flex flex-col divide-y divide-surface-200 rounded-lg border border-surface-200 dark:divide-surface-700 dark:border-surface-700">
        <li
          v-for="change in group.items"
          :key="change.id"
          class="flex min-w-0 items-center gap-2 py-2 pl-3 pr-1"
        >
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium">{{ labelOf(change) }}</span>
            <span class="truncate text-xs text-surface-500 dark:text-surface-400">{{ change.detail }}</span>
          </span>
          <Button
            v-if="change.target"
            v-tooltip.left="'Open where it\'s edited'"
            icon="pi pi-arrow-right"
            severity="secondary"
            size="small"
            text
            rounded
            :aria-label="`Open ${labelOf(change)}`"
            @click="show(change)"
          />
          <Button
            v-tooltip.left="'Revert to the base preset'"
            icon="pi pi-undo"
            severity="secondary"
            size="small"
            text
            rounded
            :aria-label="`Revert ${labelOf(change)}`"
            @click="revert(change)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

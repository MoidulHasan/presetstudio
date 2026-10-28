<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { EditorSection } from '~/utils/editor-sections'
import { listChanges } from '~/utils/theme/changes'
import { DENSITY_FACTORS } from '~/utils/theme/design'
import { BASE_PRESETS, BASE_PRESET_LABELS, SHADES, STATUS_KINDS, type BasePresetName, type SurfaceDesign } from '~/utils/theme/types'

// The theme at a glance: the base style, each decision drawn in the theme's own colors (in the
// preview's mode) one click from where it's set, and whether it's ready to ship. The guided setup
// asks the first questions; this is where you come back to after it.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const { base, baseDefault } = useBaseDefault()
const { isModified } = useSectionStatus()
const { fixable, fixAll } = useContrastFixes()
const { scheme } = useShownScheme()
const design = computed(() => workspace.theme.design)

const baseOptions = BASE_PRESETS.map(name => ({ value: name, label: BASE_PRESET_LABELS[name] }))
function setBase(value: BasePresetName | null) {
  if (!value) return
  workspace.update((d) => {
    d.basePreset = value
  })
}

// --- Decisions -----------------------------------------------------------------------------

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const RADIUS: Record<string, string> = { none: 'Square', small: 'Subtle', large: 'Rounded', xlarge: 'Soft', custom: 'Custom' }
const DENSITY: Record<string, string> = { compact: 'Compact', comfortable: 'Comfortable' }

function surfaceName(s: SurfaceDesign): string {
  if (s.kind === 'base') return baseDefault.value
  if (s.kind === 'palette') return capitalize(s.name)
  if (s.kind === 'tinted') return 'Tinted'
  return s.color
}

type Visual
  = | { kind: 'ramp', colors: string[] }
    | { kind: 'dots', colors: string[] }
    | { kind: 'text', colors: string[] }
    | { kind: 'corner', radius: string, color: string }
    | { kind: 'density', gap: number, color: string }
    | { kind: 'focus', border: string, radius: string, outline: string, offset: string }
    | { kind: 'icon', icon: string, color: string }

interface Tile { label: string, value: string, section: EditorSection, visual: Visual }

const value = (token: string) => preset.resolvers?.[scheme.value].resolve(token)?.value ?? 'transparent'
const ramp = (group: string) => {
  const palette = preset.resolvedScale(group, scheme.value)
  return SHADES.map(shade => palette?.[shade] ?? 'transparent')
}

// Drawn on the theme's own background, so a dark preview shows dark tiles.
const canvas = computed(() => ({ backgroundColor: value('content-background') }))

const tiles = computed<Tile[]>(() => {
  const d = design.value
  const statusChanged = STATUS_KINDS.filter(kind => d.status[kind].kind !== 'base').length
  const light = surfaceName(d.surface.light)
  const dark = surfaceName(d.surface.dark)
  const components = Object.keys(preset.componentOverrideCounts).length
  const factor = d.density === 'custom' ? d.densityScale : d.density === 'base' ? 1 : DENSITY_FACTORS[d.density]
  const muted = value('text-muted-color')
  const all: Tile[] = [
    {
      label: 'Brand color',
      value: d.primary.kind === 'custom' ? d.primary.color : d.primary.kind === 'palette' ? capitalize(d.primary.name) : baseDefault.value,
      section: 'primary',
      visual: { kind: 'ramp', colors: ramp('primary') },
    },
    {
      label: 'Neutrals',
      value: light === dark ? light : `${light} / ${dark}`,
      section: 'surface',
      visual: { kind: 'ramp', colors: ramp('surface') },
    },
    {
      label: 'Status colors',
      value: statusChanged ? `${statusChanged} of ${STATUS_KINDS.length} changed` : baseDefault.value,
      section: 'status',
      visual: { kind: 'dots', colors: STATUS_KINDS.map(kind => value(`button-${kind}-background`)) },
    },
    {
      label: 'Text',
      value: baseDefault.value,
      section: 'text',
      visual: { kind: 'text', colors: [value('text-color'), muted] },
    },
    {
      label: 'Corners',
      value: RADIUS[d.radius] ?? baseDefault.value,
      section: 'shape',
      visual: { kind: 'corner', radius: value('button-border-radius'), color: value('primary-color') },
    },
    {
      label: 'Density',
      value: d.density === 'custom' ? `Custom (${factor}×)` : DENSITY[d.density] ?? baseDefault.value,
      section: 'density',
      // Exaggerated, so compact and comfortable look different at this size.
      visual: { kind: 'density', gap: Math.round(2 + (factor - 0.5) * 8), color: muted },
    },
    {
      label: 'Focus ring',
      value: d.focusRing.kind === 'base' ? baseDefault.value : 'Custom outline',
      section: 'focus',
      visual: {
        kind: 'focus',
        border: value('form-field-border-color'),
        radius: value('form-field-border-radius'),
        outline: `${value('focus-ring-width')} ${value('focus-ring-style')} ${value('focus-ring-color')}`,
        offset: value('focus-ring-offset'),
      },
    },
    {
      label: 'Components',
      value: components ? `${components} customized` : 'None customized',
      section: 'components',
      visual: { kind: 'icon', icon: 'pi pi-th-large', color: muted },
    },
  ]
  // Kept the base choice but edited its tokens (a contrast fix, a shade tweak): say so.
  return all.map(tile => (tile.value === baseDefault.value && isModified(tile.section) ? { ...tile, value: `${baseDefault.value}, adjusted` } : tile))
})

function open(section: EditorSection) {
  if (section === 'components') editor.openComponentList()
  else editor.openSection(section)
}

// --- Ready to ship -------------------------------------------------------------------------

const changes = computed(() => listChanges(workspace.theme).length)
const issues = computed(() => preset.contrastIssues)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Not set up yet: the guided setup first. -->
    <div
      v-if="preset.pristine"
      class="flex items-center justify-between gap-3"
    >
      <span class="text-sm">This is {{ base }} as it comes.</span>
      <Button
        label="Run the setup"
        icon="pi pi-bolt"
        size="small"
        @click="editor.openSetup()"
      />
    </div>

    <EditorInspectorGroup
      title="Base style"
      description="The preset your theme starts from: its shapes, borders and states. Your choices sit on top of it."
    >
      <SelectButton
        :model-value="workspace.theme.basePreset"
        :options="baseOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Base style"
        size="small"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        @update:model-value="setBase"
      />
    </EditorInspectorGroup>

    <EditorInspectorGroup
      title="Your theme"
      :description="`Each choice as it looks in ${scheme === 'dark' ? 'dark' : 'light'} mode. Open one to change it.`"
    >
      <ul class="grid grid-cols-2 gap-2">
        <li
          v-for="tile in tiles"
          :key="tile.section"
        >
          <Button
            severity="secondary"
            text
            class="!flex !w-full !flex-col !items-stretch !justify-start !gap-2 !p-2 !text-left"
            :aria-label="`${tile.label}: ${tile.value}${isModified(tile.section) ? ', changed' : ''}. Open ${tile.label}`"
            @click="open(tile.section)"
          >
            <span
              class="flex h-10 items-center justify-center overflow-hidden rounded-md ring-1 ring-inset ring-black/10 dark:ring-white/10"
              :class="tile.visual.kind === 'ramp' ? '' : 'gap-1.5'"
              :style="canvas"
              aria-hidden="true"
            >
              <template v-if="tile.visual.kind === 'ramp'">
                <span
                  v-for="(color, i) in tile.visual.colors"
                  :key="i"
                  class="h-full flex-1"
                  :style="{ backgroundColor: color }"
                />
              </template>
              <template v-else-if="tile.visual.kind === 'dots'">
                <span
                  v-for="(color, i) in tile.visual.colors"
                  :key="i"
                  class="size-3.5 rounded-full"
                  :style="{ backgroundColor: color }"
                />
              </template>
              <template v-else-if="tile.visual.kind === 'text'">
                <span
                  v-for="(color, i) in tile.visual.colors"
                  :key="i"
                  class="text-base font-semibold leading-none"
                  :style="{ color }"
                >Aa</span>
              </template>
              <span
                v-else-if="tile.visual.kind === 'corner'"
                class="h-6 w-14"
                :style="{ borderRadius: tile.visual.radius, backgroundColor: tile.visual.color }"
              />
              <span
                v-else-if="tile.visual.kind === 'density'"
                class="flex flex-col"
                :style="{ gap: `${tile.visual.gap}px` }"
              >
                <span
                  v-for="i in 3"
                  :key="i"
                  class="h-1 w-16 rounded-full"
                  :style="{ backgroundColor: tile.visual.color }"
                />
              </span>
              <span
                v-else-if="tile.visual.kind === 'focus'"
                class="h-6 w-14 border"
                :style="{ borderColor: tile.visual.border, borderRadius: tile.visual.radius, outline: tile.visual.outline, outlineOffset: tile.visual.offset }"
              />
              <i
                v-else
                :class="tile.visual.icon"
                class="text-base"
                :style="{ color: tile.visual.color }"
              />
            </span>
            <span class="flex min-w-0 flex-col">
              <span class="flex items-center gap-1.5 text-sm font-medium text-surface-900 dark:text-surface-0">
                {{ tile.label }}
                <span
                  v-if="isModified(tile.section)"
                  class="size-1.5 rounded-full bg-current"
                />
              </span>
              <span class="truncate text-xs text-surface-500 dark:text-surface-400">{{ tile.value }}</span>
            </span>
          </Button>
        </li>
      </ul>
    </EditorInspectorGroup>

    <EditorInspectorGroup title="Ready to ship?">
      <ul class="flex flex-col">
        <li class="flex min-h-9 items-center gap-3">
          <i
            :class="issues ? 'pi pi-exclamation-circle text-red-600 dark:text-red-400' : 'pi pi-check-circle text-green-600 dark:text-green-400'"
            aria-hidden="true"
          />
          <span class="flex-1 text-sm">{{ issues ? `${issues} contrast check${issues === 1 ? '' : 's'} fail` : 'Contrast checks pass' }}</span>
          <Button
            v-if="issues && fixable"
            label="Fix all"
            icon="pi pi-wrench"
            size="small"
            text
            @click="fixAll"
          />
          <Button
            v-tooltip.left="'Open the contrast checks'"
            icon="pi pi-arrow-right"
            severity="secondary"
            size="small"
            text
            rounded
            aria-label="Open the contrast checks"
            @click="editor.openSection('accessibility')"
          />
        </li>
        <li class="flex min-h-9 items-center gap-3">
          <i
            :class="workspace.saved ? 'pi pi-check-circle text-green-600 dark:text-green-400' : 'pi pi-exclamation-triangle text-orange-600 dark:text-orange-400'"
            aria-hidden="true"
          />
          <span class="flex-1 text-sm">{{ workspace.saved ? 'Saved in this browser' : 'Not saved: this browser refuses storage' }}</span>
          <Button
            v-if="!workspace.saved"
            label="Download"
            icon="pi pi-download"
            size="small"
            text
            @click="editor.requestExport('share')"
          />
        </li>
        <li class="flex min-h-9 items-center gap-3">
          <i
            class="pi pi-list-check text-surface-500 dark:text-surface-400"
            aria-hidden="true"
          />
          <span class="flex-1 text-sm">{{ changes ? `${changes} change${changes === 1 ? '' : 's'} on top of ${base}` : `No changes to ${base} yet` }}</span>
          <Button
            v-if="changes"
            v-tooltip.left="'See what you changed'"
            icon="pi pi-arrow-right"
            severity="secondary"
            size="small"
            text
            rounded
            aria-label="See what you changed"
            @click="editor.openSection('changes')"
          />
        </li>
      </ul>
      <div class="flex flex-wrap items-center gap-2 pt-2">
        <Button
          label="Export"
          icon="pi pi-code"
          size="small"
          :severity="preset.pristine ? 'secondary' : undefined"
          :outlined="preset.pristine"
          @click="editor.requestExport('app')"
        />
        <Button
          label="Share"
          icon="pi pi-share-alt"
          severity="secondary"
          size="small"
          outlined
          @click="editor.requestExport('share')"
        />
        <Button
          v-if="!preset.pristine"
          label="Run the setup again"
          severity="secondary"
          size="small"
          text
          class="ml-auto"
          @click="editor.openSetup()"
        />
      </div>
    </EditorInspectorGroup>
  </div>
</template>

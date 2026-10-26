<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { tokenContrast, worseThanBase } from '~/utils/theme/contrast'
import { recolorChoice, type PaletteChoice } from '~/utils/theme/recolor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'
import { STATE_LABELS, matrixStates, stateMatrix, styleLabel as defaultStyleLabel, type StudioState, type VariantRow } from '~/utils/theme/studio'
import type { TokenResolver } from '~/utils/theme/tokens'

// Colors of a component's variants (severities): one palette per variant recolors every style
// and state in both modes; opening a variant shows a property × state grid of light|dark pairs,
// and the selected pair is edited right under the grid.
const props = withDefaults(defineProps<{
  component: string
  variants: VariantRow[]
  description: string
  styleLabel?: (style: string) => string
}>(), { styleLabel: defaultStyleLabel })

const workspace = useWorkspaceStore()
const preset = usePresetStore()

const isCustom = (t: TokenDescriptor) => tokenSource(t, workspace.theme.overrides, preset.designTokens) === 'custom'

const openRow = ref<string | null>(null)
const rowStyle = ref<Record<string, string>>({})
const { current: highlight, flash } = useFlash<{ row: string, state: StudioState }>()
const rows = ref<Record<string, HTMLElement | null>>({})

/** The color cell being edited; its editor shows under the grid (in the panel's flow). */
const selected = ref<{ row: string, style: string, property: string, state: StudioState } | null>(null)

const { both } = useShownScheme()
const styleOf = (row: VariantRow): string => rowStyle.value[row.key] ?? Object.keys(row.styles)[0]!
const matrixOf = (row: VariantRow) => stateMatrix(row.styles[styleOf(row)] ?? [])

function isSelected(row: VariantRow, property: string, state: StudioState) {
  const sel = selected.value
  return !!sel && sel.row === row.key && sel.style === styleOf(row) && sel.property === property && sel.state === state
}

function select(row: VariantRow, property: string, state: StudioState) {
  selected.value = isSelected(row, property, state) ? null : { row: row.key, style: styleOf(row), property, state }
}

/** The selected cell of a row (only while its style tab is showing). */
function selectedCell(row: VariantRow) {
  const sel = selected.value
  if (!sel || sel.row !== row.key || sel.style !== styleOf(row)) return null
  const prop = matrixOf(row).find(p => p.property === sel.property)
  const cell = prop?.cells[sel.state]
  return cell && prop ? { ...cell, label: `${prop.label} · ${STATE_LABELS[sel.state]}` } : null
}

function styleOptions(row: VariantRow) {
  return Object.keys(row.styles).map(style => ({ value: style, label: props.styleLabel(style) }))
}

function setStyle(key: string, style: string) {
  rowStyle.value = { ...rowStyle.value, [key]: style }
}

const choiceOf = (row: VariantRow): PaletteChoice | null => recolorChoice(workspace.theme.overrides, row.tokens, props.component, row.key)
const choiceValue = (choice: PaletteChoice | null): string => (choice?.kind === 'palette' ? choice.name : choice?.kind === 'custom' ? choice.color : '')

function recolor(row: VariantRow, choice: PaletteChoice | null) {
  preset.recolorGroup(props.component, row.key, row.tokens, choice)
}

/** Default-state token of the default style, e.g. the background of a filled variant. */
function mainToken(row: VariantRow, property: string, scheme: 'light' | 'dark'): TokenDescriptor | undefined {
  const cell = stateMatrix(row.styles.root ?? row.styles[Object.keys(row.styles)[0]!] ?? []).find(p => p.property === property)?.cells.default
  return scheme === 'light' ? cell?.light : cell?.dark
}

/** Main color of a variant in each mode (its background, or its text when it has none). */
function swatches(row: VariantRow): [string, string] {
  const property = mainToken(row, 'background', 'light') ? 'background' : 'color'
  const pick = (scheme: 'light' | 'dark') => {
    const token = mainToken(row, property, scheme)
    return (token && preset.resolvers?.[scheme].resolve(token.name)?.value) || 'transparent'
  }
  return [pick('light'), pick('dark')]
}

const rowChanged = (row: VariantRow) => row.tokens.some(isCustom)

function contrastOf(row: VariantRow, scheme: 'light' | 'dark', resolver: TokenResolver | null | undefined): number | null {
  const bgToken = mainToken(row, 'background', scheme)
  const fgToken = mainToken(row, 'color', scheme)
  return bgToken && fgToken ? tokenContrast(resolver, fgToken.name, bgToken.name) : null
}

/**
 * Lowest text/background contrast of a variant, when this theme made it worse than the preset's
 * and it's below AA (the presets' own severities often miss 4.5:1).
 */
function lowContrast(row: VariantRow): number | null {
  let worst: number | null = null
  for (const scheme of ['light', 'dark'] as const) {
    const now = contrastOf(row, scheme, preset.resolvers?.[scheme])
    const before = contrastOf(row, scheme, preset.baseResolvers?.[scheme])
    if (now !== null && worseThanBase(now, before)) worst = Math.min(worst ?? 99, now)
  }
  return worst
}

function toggleRow(key: string) {
  openRow.value = openRow.value === key ? null : key
}

/** Opens a variant's style and selects the main color of `state` (from a stage click). */
async function focus(key: string, style: string, state: StudioState) {
  const row = props.variants.find(v => v.key === key)
  if (!row) return
  openRow.value = key
  if (row.styles[style]) setStyle(key, style)
  const matrix = matrixOf(row)
  // A state the style doesn't have (outlined messages have no hover) falls back to default.
  const target = matrixStates(matrix).includes(state) ? state : 'default'
  flash({ row: key, state: target })
  // The first of background, border and text the style has in that state (outlined buttons
  // have no hover border, links only text).
  const property = ['background', 'borderColor', 'color'].find(p => matrix.find(m => m.property === p)?.cells[target])
  selected.value = property ? { row: key, style: styleOf(row), property, state: target } : null
  await nextTick()
  rows.value[key]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

defineExpose({ focus })
</script>

<template>
  <EditorInspectorGroup
    title="Colors"
    :description="`${description} Open a variant to fine-tune single colors.`"
  >
    <ul class="-mx-2 flex flex-col">
      <li
        v-for="row in variants"
        :key="row.key"
        :ref="el => (rows[row.key] = el as HTMLElement | null)"
        :data-stage-target="`*:${row.key}`"
        class="flex flex-col"
      >
        <EditorStudioVariantHeader
          :label="row.label"
          :open="openRow === row.key"
          :light="swatches(row)[0]"
          :dark="swatches(row)[1]"
          :changed="rowChanged(row)"
          :choice-kind="choiceOf(row)?.kind ?? 'base'"
          :choice-value="choiceValue(choiceOf(row))"
          @toggle="toggleRow(row.key)"
          @recolor="choice => recolor(row, choice)"
        />

        <div
          v-if="openRow === row.key"
          class="mx-2 mb-2 flex flex-col gap-3 rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50"
        >
          <SelectButton
            v-if="Object.keys(row.styles).length > 1"
            :model-value="styleOf(row)"
            :options="styleOptions(row)"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :aria-label="`${row.label} style`"
            size="small"
            @update:model-value="(v: string) => setStyle(row.key, v)"
          />
          <div
            class="grid items-center gap-x-2 gap-y-1.5"
            :style="{ gridTemplateColumns: `6rem repeat(${matrixStates(matrixOf(row)).length}, minmax(0, 1fr))` }"
            :data-stage-target="`${styleOf(row)}:${row.key}`"
          >
            <span class="text-[10px] text-surface-500">{{ both ? 'Light | Dark' : '' }}</span>
            <span
              v-for="state in matrixStates(matrixOf(row))"
              :key="state"
              :data-stage-target="`${styleOf(row)}:${row.key}:${state}`"
              class="text-center text-[11px] font-medium"
              :class="highlight?.row === row.key && highlight.state === state ? 'text-primary' : 'text-surface-500'"
            >{{ STATE_LABELS[state] }}</span>
            <template
              v-for="prop in matrixOf(row)"
              :key="prop.property"
            >
              <span
                class="truncate text-xs"
                :title="prop.label"
              >{{ prop.label }}</span>
              <template
                v-for="state in matrixStates(matrixOf(row))"
                :key="state"
              >
                <EditorStudioColorPair
                  v-if="prop.cells[state]"
                  :data-stage-target="`${styleOf(row)}:${row.key}:${state}`"
                  :light="prop.cells[state]!.light"
                  :dark="prop.cells[state]!.dark"
                  :label="`${prop.label} · ${STATE_LABELS[state]}`"
                  :selected="isSelected(row, prop.property, state)"
                  @select="select(row, prop.property, state)"
                />
                <span
                  v-else
                  class="text-center text-xs text-surface-400"
                  aria-hidden="true"
                >—</span>
              </template>
            </template>
          </div>
          <!-- Editor of the selected cell: in the panel's flow, light and dark together. -->
          <div
            v-if="selectedCell(row)"
            class="flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-2 dark:border-surface-700 dark:bg-surface-900"
          >
            <div class="flex items-center justify-between gap-2 px-1">
              <p class="truncate text-xs font-semibold">
                {{ styleLabel(styleOf(row)) }} {{ row.label.toLowerCase() }} · {{ selectedCell(row)!.label.toLowerCase() }}
              </p>
              <Button
                icon="pi pi-times"
                severity="secondary"
                size="small"
                text
                rounded
                class="!size-6 shrink-0"
                aria-label="Close color editor"
                @click="selected = null"
              />
            </div>
            <EditorTokenRow
              v-if="selectedCell(row)!.light"
              :token="selectedCell(row)!.light!"
              scheme="light"
              label="Light mode"
              :expanded="true"
            />
            <EditorTokenRow
              v-if="selectedCell(row)!.dark"
              :token="selectedCell(row)!.dark!"
              scheme="dark"
              label="Dark mode"
              :expanded="true"
            />
          </div>
          <Message
            v-if="lowContrast(row)"
            severity="warn"
            size="small"
            variant="simple"
          >
            Text drops to {{ lowContrast(row)!.toFixed(1) }}:1 on the background (WCAG AA needs 4.5:1). Try a darker palette or edit Text.
          </Message>
          <div class="flex justify-end">
            <Button
              v-if="rowChanged(row)"
              :label="`Reset ${row.label}`"
              icon="pi pi-undo"
              severity="secondary"
              size="small"
              text
              @click="recolor(row, null)"
            />
          </div>
        </div>
      </li>
    </ul>
  </EditorInspectorGroup>
</template>

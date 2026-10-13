<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { componentPath } from '~/utils/theme/components'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import { customPalettePath, type PaletteChoice } from '~/utils/theme/recolor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'
import { BUTTON_STYLE_LABELS, STATE_LABELS, STUDIO_STATES, buttonVariants, stateMatrix, type ButtonStyle, type StudioState, type VariantRow } from '~/utils/theme/studio'
import { createResolver, type TokenResolver } from '~/utils/theme/tokens'
import { getPath } from '~/utils/theme/tree'

// Visual editor for Button: colors per variant (one palette recolors every state, both
// modes; cells fine-tune), then shape, size, text and effects as real controls.
const store = useEditorStore()

const buttonTokens = computed(() => store.descriptors.filter(t => t.component === 'button'))
const variants = computed(() => buttonVariants(store.descriptors))

/** Shared (both modes) Button token by its path below `components.button`, e.g. 'root.paddingX'. */
function shared(path: string): TokenDescriptor | undefined {
  return buttonTokens.value.find(t => t.scheme === null && componentPath(t).join('.') === path)
}

const isCustom = (t: TokenDescriptor) => tokenSource(t, store.theme.overrides, store.designTokens) === 'custom'

// --- Colors --------------------------------------------------------------------------
const openRow = ref<string | null>(null)
const rowStyle = ref<Record<string, ButtonStyle>>({})
const highlight = ref<{ row: string, state: StudioState } | null>(null)

/** The color cell being edited; its editor shows under the grid (in the panel's flow). */
const selected = ref<{ row: string, style: ButtonStyle, property: string, state: StudioState } | null>(null)

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
  const prop = stateMatrix(row.styles[sel.style] ?? []).find(p => p.property === sel.property)
  const cell = prop?.cells[sel.state]
  return cell && prop ? { ...cell, label: `${prop.label} · ${STATE_LABELS[sel.state]}` } : null
}

function styleOptions(row: VariantRow) {
  return (Object.keys(row.styles) as ButtonStyle[]).map(style => ({ value: style, label: BUTTON_STYLE_LABELS[style] }))
}

function setStyle(key: string, style: ButtonStyle) {
  rowStyle.value = { ...rowStyle.value, [key]: style }
}

const styleOf = (row: VariantRow): ButtonStyle =>
  rowStyle.value[row.key] ?? (Object.keys(row.styles)[0] as ButtonStyle)

/** The palette a variant was recolored with (from the overrides), or null for the preset's. */
function choiceOf(row: VariantRow): PaletteChoice | null {
  const custom = getPath(store.theme.overrides, customPalettePath('button', row.key))
  if (custom && typeof custom === 'object' && typeof custom['500'] === 'string') return { kind: 'custom', color: custom['500'] }
  for (const token of row.tokens) {
    const value = getPath(store.theme.overrides, token.path)
    const match = typeof value === 'string' ? /\{([a-z]+)\.\d+\}/.exec(value) : null
    if (match && match[1] !== 'ps') return { kind: 'palette', name: match[1]! }
  }
  return null
}

function recolor(row: VariantRow, choice: PaletteChoice | null) {
  store.recolorGroup('button', row.key, row.tokens, choice)
}

/** Main color of a variant in each mode (filled background, or text for outlined-only/link). */
function swatches(row: VariantRow): [string, string] {
  const main = row.styles.root?.find(t => componentPath(t).at(-1) === 'background') ? 'background' : 'color'
  const pick = (scheme: 'light' | 'dark') => {
    const token = row.tokens.find(t => t.scheme === scheme && componentPath(t).at(-1) === main)
    return (token && store.resolvers?.[scheme].resolve(token.name)?.value) || 'transparent'
  }
  return [pick('light'), pick('dark')]
}

const rowChanged = (row: VariantRow) => row.tokens.some(isCustom)

function buttonContrast(r: TokenResolver | null | undefined, key: string): number | null {
  const bg = parseColor(r?.resolve(`button-${key}-background`)?.value ?? '')
  const fg = parseColor(r?.resolve(`button-${key}-color`)?.value ?? '')
  return bg && fg ? contrastRatio(fg, bg) : null
}

const baseResolvers = computed(() => (store.basePreset ? { light: createResolver(store.basePreset, 'light'), dark: createResolver(store.basePreset, 'dark') } : null))

/**
 * Lowest text/background contrast of a filled variant, when this theme made it worse than the
 * preset's and it's below AA (the presets' own severities often miss 4.5:1).
 */
function lowContrast(row: VariantRow): number | null {
  let worst: number | null = null
  for (const scheme of ['light', 'dark'] as const) {
    const now = buttonContrast(store.resolvers?.[scheme], row.key)
    const before = buttonContrast(baseResolvers.value?.[scheme], row.key)
    if (now !== null && now < 4.5 && (before === null || now < before - 0.05)) worst = Math.min(worst ?? 99, now)
  }
  return worst
}

function toggleRow(key: string) {
  openRow.value = openRow.value === key ? null : key
}

// --- Size ----------------------------------------------------------------------------
const size = ref<'sm' | 'normal' | 'lg'>('normal')
const sizePath = (key: string) => (size.value === 'normal' ? `root.${key}` : `root.${size.value}.${key}`)

const FONT_WEIGHTS = ['400', '500', '600', '700', '800'].map(value => ({ value, label: { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold' }[value]! }))
const fontWeight = computed(() => shared('root.label.fontWeight'))
const fontWeightValue = computed(() => (fontWeight.value ? store.resolvers?.light.resolve(fontWeight.value.name)?.value : undefined))

// Raised shadow presets (the stock presets all use the "Medium" one).
const SHADOWS = [
  { value: 'none', label: 'None' },
  { value: '0 1px 2px 0 rgba(0, 0, 0, 0.08)', label: 'Subtle' },
  { value: '0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', label: 'Medium' },
  { value: '0 4px 12px -2px rgba(0, 0, 0, 0.25)', label: 'Strong' },
]
const raised = computed(() => shared('root.raisedShadow'))
const raisedValue = computed(() => (raised.value ? String(store.resolvers?.light.resolve(raised.value.name)?.raw ?? '') : ''))
const raisedOptions = computed(() => SHADOWS.some(s => s.value === raisedValue.value) ? SHADOWS : [...SHADOWS, { value: raisedValue.value, label: 'Custom' }])

// --- Stage picks -----------------------------------------------------------------------
const sections = ref<Record<string, HTMLElement | null>>({})
const rows = ref<Record<string, HTMLElement | null>>({})

watch(() => store.stagePick, async (pick) => {
  if (!pick) return
  const [style, key, state] = pick.target.split(':')
  if (style === 'size' || style === 'shape') {
    sections.value[style]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    return
  }
  if (!key) return
  openRow.value = key
  rowStyle.value = { ...rowStyle.value, [key]: style as ButtonStyle }
  const pickedState = (state as StudioState) ?? 'default'
  highlight.value = { row: key, state: pickedState }
  // Open the main color of what was clicked: the first of background, border and text that
  // the style has in that state (outlined buttons have no hover border, link only text).
  const row = variants.value.find(v => v.key === key)
  const matrix = stateMatrix(row?.styles[style as ButtonStyle] ?? [])
  const property = ['background', 'borderColor', 'color'].find(p => matrix.find(m => m.property === p)?.cells[pickedState])
  selected.value = property ? { row: key, style: style as ButtonStyle, property, state: pickedState } : null
  await nextTick()
  rows.value[key]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  setTimeout(() => {
    if (highlight.value?.row === key) highlight.value = null
  }, 1600)
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Colors -->
    <EditorInspectorGroup
      title="Colors"
      description="One palette recolors a variant in every state and in both modes, keeping the preset's shades. Open a variant to fine-tune single colors."
    >
      <ul class="flex flex-col divide-y divide-surface-200 rounded-lg border border-surface-200 dark:divide-surface-700 dark:border-surface-700">
        <li
          v-for="row in variants"
          :key="row.key"
          :ref="el => (rows[row.key] = el as HTMLElement | null)"
          class="flex flex-col"
        >
          <div class="flex items-center gap-2 px-2 py-1.5">
            <Button
              severity="secondary"
              text
              class="!min-w-0 !flex-1 !justify-start !gap-2 !px-1 !py-1"
              :aria-expanded="openRow === row.key"
              :aria-label="`${row.label} colors`"
              @click="toggleRow(row.key)"
            >
              <i
                class="pi text-xs text-surface-400"
                :class="openRow === row.key ? 'pi-chevron-down' : 'pi-chevron-right'"
                aria-hidden="true"
              />
              <span
                class="flex h-5 w-8 shrink-0 overflow-hidden rounded border border-surface-300 dark:border-surface-600"
                aria-hidden="true"
              >
                <span
                  class="flex-1"
                  :style="{ background: swatches(row)[0] }"
                />
                <span
                  class="flex-1"
                  :style="{ background: swatches(row)[1] }"
                />
              </span>
              <span class="truncate text-sm text-surface-900 dark:text-surface-0">{{ row.label }}</span>
              <span
                v-if="rowChanged(row)"
                v-tooltip.top="'Changed'"
                class="size-1.5 shrink-0 rounded-full bg-surface-900 dark:bg-surface-0"
                aria-hidden="true"
              />
            </Button>
            <EditorStudioPalettePicker
              class="w-36 shrink-0"
              :model-value="choiceOf(row)"
              :label="row.label"
              @update:model-value="choice => recolor(row, choice)"
            />
          </div>

          <div
            v-if="openRow === row.key"
            class="flex flex-col gap-3 border-t border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50"
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
              @update:model-value="(v: ButtonStyle) => setStyle(row.key, v)"
            />
            <div class="grid grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] items-center gap-x-2 gap-y-1.5">
              <span class="text-[10px] text-surface-500"><i
                class="pi pi-sun"
                aria-hidden="true"
              /> | <i
                class="pi pi-moon"
                aria-hidden="true"
              /></span>
              <span
                v-for="state in STUDIO_STATES"
                :key="state"
                class="text-center text-[11px] font-medium"
                :class="highlight?.row === row.key && highlight.state === state ? 'text-primary' : 'text-surface-500'"
              >{{ STATE_LABELS[state] }}</span>
              <template
                v-for="prop in stateMatrix(row.styles[styleOf(row)] ?? [])"
                :key="prop.property"
              >
                <span class="truncate text-xs">{{ prop.label }}</span>
                <template
                  v-for="state in STUDIO_STATES"
                  :key="state"
                >
                  <EditorStudioColorPair
                    v-if="prop.cells[state]"
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
                  {{ BUTTON_STYLE_LABELS[styleOf(row)] }} {{ row.label.toLowerCase() }} · {{ selectedCell(row)!.label.toLowerCase() }}
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
              v-if="row.styles.root && lowContrast(row)"
              severity="warn"
              size="small"
              variant="simple"
            >
              Text on the filled button drops to {{ lowContrast(row)!.toFixed(1) }}:1 (WCAG AA needs 4.5:1). Try a darker palette or edit Text.
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

    <!-- Shape -->
    <div :ref="el => (sections.shape = el as HTMLElement | null)">
      <EditorInspectorGroup
        title="Shape"
        description="By default Button follows the form field radius from the Shape section."
      >
        <EditorStudioLength
          :token="shared('root.borderRadius')"
          label="Corner radius"
          :max="24"
        />
        <EditorStudioLength
          :token="shared('root.roundedBorderRadius')"
          label="Rounded button radius"
          :max="48"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Size -->
    <div :ref="el => (sections.size = el as HTMLElement | null)">
      <EditorInspectorGroup title="Size and spacing">
        <SelectButton
          v-model="size"
          :options="[{ value: 'sm', label: 'Small' }, { value: 'normal', label: 'Normal' }, { value: 'lg', label: 'Large' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Button size to edit"
          size="small"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        />
        <EditorStudioLength
          :token="shared(sizePath('paddingX'))"
          label="Horizontal padding"
        />
        <EditorStudioLength
          :token="shared(sizePath('paddingY'))"
          label="Vertical padding"
          :max="24"
        />
        <EditorStudioLength
          v-if="size !== 'normal'"
          :token="shared(sizePath('fontSize'))"
          label="Font size"
          :min="8"
          :max="28"
        />
        <EditorStudioLength
          :token="shared(sizePath('iconOnlyWidth'))"
          label="Icon-only width"
          :min="16"
          :max="72"
        />
        <EditorStudioLength
          v-if="size === 'normal'"
          :token="shared('root.gap')"
          label="Gap between icon and label"
          :max="24"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Text -->
    <EditorInspectorGroup title="Text">
      <div
        v-if="fontWeight"
        class="flex items-center justify-between gap-3"
      >
        <label
          for="button-font-weight"
          class="flex items-center gap-1.5 text-xs font-medium"
        >
          Label weight
          <span
            v-if="isCustom(fontWeight)"
            class="size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
            aria-hidden="true"
          />
        </label>
        <Select
          input-id="button-font-weight"
          :model-value="fontWeightValue"
          :options="FONT_WEIGHTS"
          option-label="label"
          option-value="value"
          size="small"
          class="w-36"
          @update:model-value="(v: string) => store.setToken(fontWeight!.path, v)"
        />
      </div>
    </EditorInspectorGroup>

    <!-- Effects -->
    <EditorInspectorGroup
      title="Effects"
      description="The shadow of raised buttons. Focus rings are set for all components in Focus ring."
    >
      <div
        v-if="raised"
        class="flex items-center justify-between gap-3"
      >
        <label
          for="button-raised-shadow"
          class="flex items-center gap-1.5 text-xs font-medium"
        >
          Raised shadow
          <span
            v-if="isCustom(raised)"
            class="size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
            aria-hidden="true"
          />
        </label>
        <Select
          input-id="button-raised-shadow"
          :model-value="raisedValue"
          :options="raisedOptions"
          option-label="label"
          option-value="value"
          size="small"
          class="w-36"
          @update:model-value="(v: string) => store.setToken(raised!.path, v)"
        />
      </div>
      <EditorStudioLength
        :token="shared('root.badgeSize')"
        label="Badge size"
        :min="8"
        :max="32"
      />
    </EditorInspectorGroup>

    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every Button token is there.
    </p>
  </div>
</template>

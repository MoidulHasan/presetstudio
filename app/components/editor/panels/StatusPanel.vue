<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import { normalizeHex } from '~/utils/theme/palette'
import { createResolver } from '~/utils/theme/tokens'
import {
  BASE_PRESET_LABELS,
  NEUTRAL_COLORS,
  PRIMITIVE_COLORS,
  STATUS_KINDS,
  type PrimitiveColorName,
  type StatusDesign,
  type StatusKind,
} from '~/utils/theme/types'

const store = useEditorStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[store.theme.basePreset])

const META: Record<StatusKind, { label: string, hint: string }> = {
  info: { label: 'Info', hint: 'Hints and neutral notices' },
  success: { label: 'Success', hint: 'Confirmations and positive states' },
  warn: { label: 'Warning', hint: 'Cautions that need attention' },
  danger: { label: 'Danger', hint: 'Errors and destructive actions' },
  help: { label: 'Help', hint: 'Help buttons' },
}

const CHROMATIC = PRIMITIVE_COLORS.filter(c => !(NEUTRAL_COLORS as readonly string[]).includes(c))

type Choice = 'base' | 'custom' | PrimitiveColorName
const choiceOf = (s: StatusDesign): Choice => (s.kind === 'palette' ? s.name : s.kind)

const swatch = (name: string, shade = '500') => store.resolvers?.light.resolve(`${name}-${shade}`)?.value ?? 'transparent'

/** The primitive a preset uses for a severity's buttons, e.g. 'sky' for info in Aura. */
const baseResolver = computed(() => (store.basePreset ? createResolver(store.basePreset, 'light') : null))
function baseColor(kind: StatusKind): string {
  const last = baseResolver.value?.resolve(`button-${kind}-background`)?.chain.at(-1) ?? ''
  return last.replace(/-\d+$/, '')
}

function options(kind: StatusKind) {
  return [
    { value: 'base', label: `${baseLabel.value} default (${baseColor(kind)})`, color: baseColor(kind) },
    ...CHROMATIC.map(name => ({ value: name, label: name.charAt(0).toUpperCase() + name.slice(1), color: name })),
    { value: 'custom', label: 'Custom color…', color: null },
  ]
}

function setStatus(kind: StatusKind, value: StatusDesign, key: string | null = null) {
  store.update((d) => {
    d.design.status[kind] = value
  }, key)
}

function choose(kind: StatusKind, choice: Choice) {
  if (choice === choiceOf(store.theme.design.status[kind])) return
  if (choice === 'base') return setStatus(kind, { kind: 'base' })
  // A custom color starts from what the buttons use now.
  if (choice === 'custom') return setStatus(kind, { kind: 'custom', color: normalizeHex(preview.value[kind].button) ?? '#3b82f6' })
  setStatus(kind, { kind: 'palette', name: choice })
}

function pickerValue(kind: StatusKind) {
  const s = store.theme.design.status[kind]
  return s.kind === 'custom' ? s.color.slice(1) : '000000'
}

function setCustom(kind: StatusKind, value: string | undefined) {
  const hex = value ? normalizeHex(value) : null
  if (hex) setStatus(kind, { kind: 'custom', color: hex }, `status.${kind}.color`)
}

// What the severity looks like right now (light mode), for the inline previews.
function buttonContrast(r: ReturnType<typeof createResolver> | null | undefined, kind: StatusKind): number | null {
  const fg = parseColor(r?.resolve(`button-${kind}-color`)?.value ?? '')
  const bg = parseColor(r?.resolve(`button-${kind}-background`)?.value ?? '')
  return fg && bg ? contrastRatio(fg, bg) : null
}

const preview = computed(() => {
  const r = store.resolvers?.light
  const v = (name: string) => r?.resolve(name)?.value ?? 'transparent'
  return Object.fromEntries(STATUS_KINDS.map((kind) => {
    const ratio = buttonContrast(r, kind)
    const baseRatio = buttonContrast(baseResolver.value, kind)
    return [kind, {
      button: v(`button-${kind}-background`),
      text: v(`button-${kind}-color`),
      tagBackground: v(`tag-${kind}-background`),
      tagColor: v(`tag-${kind}-color`),
      ratio,
      // Only flag what this theme makes worse; the presets' own severities often miss 4.5:1.
      worse: store.theme.design.status[kind].kind !== 'base' && ratio !== null && ratio < 4.5 && (baseRatio === null || ratio < baseRatio - 0.05),
    }]
  })) as Record<StatusKind, { button: string, text: string, tagBackground: string, tagColor: string, ratio: number | null, worse: boolean }>
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-xs text-surface-500 dark:text-surface-400">
      Each severity keeps the preset's shades, so light backgrounds, borders and text stay balanced. Pick
      the Messages or Button category in the preview to see every use.
    </p>
    <section
      v-for="kind in STATUS_KINDS"
      :key="kind"
      class="flex flex-col gap-3 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
      :aria-label="`${META[kind].label} color`"
    >
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold">
            {{ META[kind].label }}
          </h3>
          <p class="truncate text-xs text-surface-500 dark:text-surface-400">
            {{ META[kind].hint }}
          </p>
        </div>
        <!-- Live look of the severity: a solid button and a soft tag. -->
        <span
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium"
          :style="{ background: preview[kind].button, color: preview[kind].text }"
          aria-hidden="true"
        >Button</span>
        <span
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium"
          :style="{ background: preview[kind].tagBackground, color: preview[kind].tagColor }"
          aria-hidden="true"
        >Tag</span>
      </div>

      <Select
        :model-value="choiceOf(store.theme.design.status[kind])"
        :options="options(kind)"
        option-label="label"
        option-value="value"
        :aria-label="`${META[kind].label} palette`"
        size="small"
        fluid
        scroll-height="18rem"
        @update:model-value="(v: Choice) => choose(kind, v)"
      >
        <template #value="{ value }">
          <span class="flex items-center gap-2">
            <span
              class="size-3.5 shrink-0 rounded-full"
              :style="{ background: value === 'custom' || value === 'base' ? preview[kind].button : swatch(value) }"
              aria-hidden="true"
            />
            {{ options(kind).find(o => o.value === value)?.label }}
          </span>
        </template>
        <template #option="{ option }">
          <span class="flex items-center gap-2">
            <span
              v-if="option.color"
              class="size-3.5 shrink-0 rounded-full"
              :style="{ background: swatch(option.color) }"
              aria-hidden="true"
            />
            <i
              v-else
              class="pi pi-palette text-xs"
              aria-hidden="true"
            />
            {{ option.label }}
          </span>
        </template>
      </Select>

      <div
        v-if="store.theme.design.status[kind].kind === 'custom'"
        class="flex items-center gap-2"
      >
        <ColorPicker
          :model-value="pickerValue(kind)"
          :aria-label="`Pick the ${META[kind].label} color`"
          @update:model-value="(v: string) => setCustom(kind, v)"
        />
        <InputText
          :model-value="(store.theme.design.status[kind] as { color: string }).color"
          :aria-label="`${META[kind].label} color hex`"
          size="small"
          class="w-28 font-mono"
          @change="(e: Event) => setCustom(kind, (e.target as HTMLInputElement).value)"
        />
        <span class="text-xs text-surface-500">becomes shade 500</span>
      </div>

      <Message
        v-if="preview[kind].worse"
        severity="warn"
        size="small"
        variant="simple"
      >
        Button text contrast drops to {{ preview[kind].ratio?.toFixed(1) }}:1 (WCAG AA needs 4.5:1). Try a darker color.
      </Message>
    </section>

    <EditorStudioLink
      component="button"
      text="Fine-tune how buttons use these colors"
    />
  </div>
</template>

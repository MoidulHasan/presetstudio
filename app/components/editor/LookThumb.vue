<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { buildEffectivePreset } from '~/utils/theme/build'
import { loadBasePreset } from '~/utils/theme/presets'
import { createResolver } from '~/utils/theme/tokens'
import type { BasePresetName, TokenTree } from '~/utils/theme/types'

// A small scene drawn from a base preset's own tokens, with the theme's design applied: a
// focused field, a selected item, a button and a switch off and on, in the preset's card. These
// are where the presets differ (Lara's focus glow, Nora's solid selection and outlined switch,
// Material's switch handle, corners, borders, weights), not the brand color.
const props = defineProps<{ name: BasePresetName }>()

const workspace = useWorkspaceStore()
const base = shallowRef<TokenTree | null>(null)
onMounted(async () => {
  base.value = (await loadBasePreset(props.name)) as unknown as TokenTree
})

// The scene is laid out at full size in em (1em = 16px) and scaled by its font size, which
// follows the thumbnail's width (container query units), so shadows and rings scale with it.
// Material lifts its switch handle with an elevation shadow from its component CSS (not a token);
// without it the white handle would vanish on the card.
const HANDLE_SHADOW: Partial<Record<BasePresetName, string>> = {
  material: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)',
}

const em = (value: string) => value
  .replace(/(-?\d*\.?\d+)px/g, (_, n: string) => `${Number(n) / 16}em`)
  .replace(/rem/g, 'em')

const look = computed(() => {
  if (!base.value) return null
  const r = createResolver(buildEffectivePreset(workspace.theme, base.value), 'light')
  const v = (token: string, fallback = '') => String(r.resolve(token)?.value ?? fallback)
  const shadows = (...tokens: string[]) => tokens.map(t => v(t, 'none')).filter(s => s && s !== 'none').map(em).join(', ') || 'none'

  const ringStyle = v('form-field-focus-ring-style', 'none')
  return {
    card: {
      background: v('content-background', '#fff'),
      border: `1px solid ${v('content-border-color', '#e2e8f0')}`,
      borderRadius: em(v('content-border-radius', '6px')),
      boxShadow: shadows('card-shadow'),
      color: v('text-color', '#334155'),
    },
    field: {
      background: v('form-field-background', '#fff'),
      color: v('form-field-color', '#334155'),
      border: `1px solid ${v('form-field-focus-border-color', '#10b981')}`,
      borderRadius: em(v('inputtext-border-radius', '6px')),
      padding: `${em(v('form-field-padding-y', '0.5rem'))} ${em(v('form-field-padding-x', '0.75rem'))}`,
      boxShadow: shadows('form-field-shadow', 'form-field-focus-ring-shadow'),
      outline: ringStyle === 'none' ? 'none' : `${em(v('form-field-focus-ring-width', '0'))} ${ringStyle} ${v('form-field-focus-ring-color', 'transparent')}`,
      outlineOffset: em(v('form-field-focus-ring-offset', '0')),
    },
    selected: {
      background: v('list-option-selected-background', '#ecfdf5'),
      color: v('list-option-selected-color', '#047857'),
      borderRadius: em(v('list-option-border-radius', '4px')),
      padding: em(v('list-option-padding', '0.5rem 0.75rem')),
    },
    button: {
      background: v('button-primary-background', '#10b981'),
      color: v('button-primary-color', '#fff'),
      border: `1px solid ${v('button-primary-border-color', '#10b981')}`,
      borderRadius: em(v('button-border-radius', '6px')),
      padding: `${em(v('button-padding-y', '0.5rem'))} ${em(v('button-padding-x', '0.75rem'))}`,
      fontWeight: v('button-label-font-weight', '500'),
    },
    switches: [false, true].map(on => ({
      track: {
        width: em(v('toggleswitch-width', '2.5rem')),
        height: em(v('toggleswitch-height', '1.5rem')),
        borderRadius: em(v('toggleswitch-border-radius', '30px')),
        background: v(on ? 'toggleswitch-checked-background' : 'toggleswitch-background', '#cbd5e1'),
        border: `${v('toggleswitch-border-width', '1px')} solid ${v(on ? 'toggleswitch-checked-border-color' : 'toggleswitch-border-color', 'transparent')}`,
      },
      handle: {
        width: em(v('toggleswitch-handle-size', '1rem')),
        height: em(v('toggleswitch-handle-size', '1rem')),
        background: v(on ? 'toggleswitch-handle-checked-background' : 'toggleswitch-handle-background', '#fff'),
        boxShadow: em(HANDLE_SHADOW[props.name] ?? 'none'),
        [on ? 'right' : 'left']: em(v('toggleswitch-gap', '0.25rem')),
      },
    })),
  }
})
</script>

<template>
  <div
    class="@container w-full rounded-md bg-surface-100 dark:bg-surface-800"
    aria-hidden="true"
  >
    <!-- 260 x 184 px at full size (room for the roomiest preset, Material); 100 / 16.25 = 6.15:
         one em is 1/16.25 of the width. -->
    <div class="flex aspect-[260/184] items-center p-[0.5em] text-left text-[6.15cqw] font-normal leading-[1.25]">
      <div
        v-if="look"
        class="flex w-full flex-col gap-[0.5em] p-[0.625em]"
        :style="look.card"
      >
        <!-- Paddings are in the 16px em; only the labels are 14px. -->
        <span
          class="block truncate"
          :style="look.field"
        ><span class="text-[0.875em]">Email</span></span>
        <span
          class="block truncate"
          :style="look.selected"
        ><span class="text-[0.875em]">Selected</span></span>
        <span class="flex items-center gap-[0.625em]">
          <span :style="look.button"><span class="text-[0.875em]">Save</span></span>
          <span
            v-for="(item, index) in look.switches"
            :key="index"
            class="relative box-border shrink-0"
            :style="item.track"
          >
            <span
              class="absolute top-1/2 -translate-y-1/2 rounded-full"
              :style="item.handle"
            />
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

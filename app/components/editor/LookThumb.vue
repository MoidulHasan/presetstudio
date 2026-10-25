<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { buildEffectivePreset } from '~/utils/theme/build'
import { loadBasePreset } from '~/utils/theme/presets'
import { createResolver } from '~/utils/theme/tokens'
import type { BasePresetName, TokenTree } from '~/utils/theme/types'

// A tiny picture of a base preset (card, input, button, checkbox) drawn from its own tokens
// with the theme's design applied, so the looks can be compared at a glance.
const props = defineProps<{ name: BasePresetName }>()

const workspace = useWorkspaceStore()
const base = shallowRef<TokenTree | null>(null)
onMounted(async () => {
  base.value = (await loadBasePreset(props.name)) as unknown as TokenTree
})

const look = computed(() => {
  if (!base.value) return null
  const r = createResolver(buildEffectivePreset(workspace.theme, base.value), 'light')
  const v = (token: string, fallback: string) => r.resolve(token)?.value ?? fallback
  return {
    card: { background: v('content-background', '#fff'), borderColor: v('content-border-color', '#e2e8f0'), borderRadius: v('content-border-radius', '6px') },
    input: { background: v('form-field-background', '#fff'), borderColor: v('form-field-border-color', '#cbd5e1'), borderRadius: v('form-field-border-radius', '6px') },
    button: { background: v('button-primary-background', '#10b981'), borderRadius: v('button-border-radius', '6px') },
    check: { background: v('checkbox-checked-background', '#10b981'), borderRadius: v('checkbox-border-radius', '4px') },
  }
})
</script>

<template>
  <div
    class="flex h-16 w-full flex-col justify-center gap-1.5 border p-2"
    :style="look?.card"
    aria-hidden="true"
  >
    <template v-if="look">
      <span
        class="block h-3.5 w-full border"
        :style="look.input"
      />
      <span class="flex items-center gap-1.5">
        <span
          class="block h-3.5 w-10"
          :style="look.button"
        />
        <span
          class="block size-3"
          :style="look.check"
        />
      </span>
    </template>
  </div>
</template>

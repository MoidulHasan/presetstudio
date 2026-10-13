<script setup lang="ts">
import type { TokenDescriptor } from '~/utils/theme/schema'

// One studio control; the widget follows the token kind.
const props = defineProps<{ token: TokenDescriptor, label: string, hint?: string, min?: number, max?: number }>()

const kind = computed(() => {
  if (props.token.kind === 'fontWeight') return 'weight'
  if (props.token.kind === 'shadow') return 'shadow'
  if (props.token.kind === 'spacing' && /\s/.test(String(props.token.defaultValue).trim())) return 'spacing'
  return 'length'
})
</script>

<template>
  <EditorStudioWeight
    v-if="kind === 'weight'"
    :token="token"
    :label="label"
    :hint="hint"
  />
  <EditorStudioShadow
    v-else-if="kind === 'shadow'"
    :token="token"
    :label="label"
    :hint="hint"
  />
  <EditorStudioSpacing
    v-else-if="kind === 'spacing'"
    :token="token"
    :label="label"
    :hint="hint"
    :max="max"
  />
  <EditorStudioLength
    v-else
    :token="token"
    :label="label"
    :hint="hint"
    :min="min"
    :max="max"
  />
</template>

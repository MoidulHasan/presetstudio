<script setup lang="ts">
import { HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// The Message stage: every severity in the default, outlined and simple styles (close button
// at rest and hovered), plus sizes. Clicking tells the editor what to edit.
const emit = defineEmits<{ pick: [target: string] }>()

const SEVERITIES = ['info', 'success', 'warn', 'error', 'secondary', 'contrast'] as const
const STYLES = [
  { key: 'root', label: 'Default', variant: undefined },
  { key: 'outlined', label: 'Outlined', variant: 'outlined' },
  { key: 'simple', label: 'Simple', variant: 'simple' },
] as const
const ICONS: Record<string, string> = { info: 'pi pi-info-circle', success: 'pi pi-check-circle', warn: 'pi pi-exclamation-triangle', error: 'pi pi-times-circle', secondary: 'pi pi-comment', contrast: 'pi pi-bolt' }
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
</script>

<template>
  <PreviewStageSchemes intro="Every severity in every style. The second column shows the close button hovered. Click a message to edit it.">
    <template #default>
      <div
        v-for="style in STYLES"
        :key="style.key"
        class="flex flex-col gap-3"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          {{ style.label }}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <template
            v-for="severity in SEVERITIES"
            :key="severity"
          >
            <div
              v-for="hover in [false, true]"
              :key="String(hover)"
              :class="hover ? HOVER_CLASS : ''"
              class="min-w-0 cursor-pointer"
              @click="emit('pick', `${style.key}:${severity}:${hover ? 'hover' : 'default'}`)"
            >
              <Message
                :severity="severity"
                :variant="style.variant"
                :icon="ICONS[severity]"
                :closable="style.key !== 'simple'"
              >
                {{ label(severity) }} message
              </Message>
            </div>
          </template>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Sizes
        </h3>
        <div
          v-for="size in (['small', 'large'] as const)"
          :key="size"
          class="cursor-pointer"
          @click="emit('pick', `section:size:${size === 'small' ? 'sm' : 'lg'}`)"
        >
          <Message
            severity="info"
            :size="size"
            icon="pi pi-info-circle"
            closable
          >
            {{ label(size) }} message
          </Message>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>

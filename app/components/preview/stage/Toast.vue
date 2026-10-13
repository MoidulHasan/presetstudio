<script setup lang="ts">
import { HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// The Toast stage: every severity as a static toast (PrimeVue's own markup and classes, so
// the real toast styles apply without the toast service). Clicking tells the editor what to edit.
const emit = defineEmits<{ pick: [target: string] }>()

const SEVERITIES = ['info', 'success', 'warn', 'error', 'secondary', 'contrast'] as const
const ICONS: Record<string, string> = { info: 'pi pi-info-circle', success: 'pi pi-check', warn: 'pi pi-exclamation-triangle', error: 'pi pi-times-circle', secondary: 'pi pi-info-circle', contrast: 'pi pi-info-circle' }
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
</script>

<template>
  <PreviewStageSchemes intro="Every severity, the last one with its close button hovered. Click a toast to edit it.">
    <template #default>
      <div
        class="p-toast p-component !w-full max-w-[var(--p-toast-width)]"
        data-pc-name="toast"
      >
        <div
          v-for="(severity, index) in SEVERITIES"
          :key="severity"
          :class="[`p-toast-message p-toast-message-${severity}`, index === SEVERITIES.length - 1 ? HOVER_CLASS : '']"
          class="cursor-pointer"
          @click="emit('pick', `root:${severity}:${index === SEVERITIES.length - 1 ? 'hover' : 'default'}`)"
        >
          <div class="p-toast-message-content">
            <i
              :class="ICONS[severity]"
              class="p-toast-message-icon"
              aria-hidden="true"
            />
            <div class="p-toast-message-text">
              <span class="p-toast-summary">{{ label(severity) }}</span>
              <div class="p-toast-detail">
                Details about this {{ severity }} notification.
              </div>
            </div>
            <div>
              <button
                class="p-toast-close-button"
                type="button"
                tabindex="-1"
                aria-label="Close"
              >
                <i
                  class="pi pi-times p-toast-close-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>

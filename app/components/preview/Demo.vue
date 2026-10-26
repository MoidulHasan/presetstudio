<script setup lang="ts">
import { studioFor } from '~/utils/theme/components'
import { createInspectMessage } from '~/utils/theme/messages'

// One component demo in the gallery: a title and the live component.
const props = defineProps<{ title: string, wide?: boolean }>()

// Components named in the title ('Badge · OverlayBadge' → 'badge overlaybadge'), so the editor
// can reveal components that only render on demand (dialogs, popovers, tooltips) by their demo.
const demoOf = computed(() => props.title.split('·').map(part => part.trim().split(/[\s(]/)[0]!.toLowerCase()).join(' '))

// Inside the editor, demos of components with a visual editor link straight to it.
const embedded = import.meta.client && window.parent !== window
// ButtonGroup isn't a themed component; it's edited as part of Button.
const studio = computed(() => {
  if (!embedded) return null
  const names = demoOf.value.split(' ')
  return names.find(name => studioFor(name)) ?? (names.includes('buttongroup') ? 'button' : null)
})

function customize() {
  if (studio.value) window.parent.postMessage(createInspectMessage(studio.value), window.location.origin)
}
</script>

<template>
  <section
    class="flex min-w-0 flex-col gap-3 rounded-xl border border-surface bg-surface-0 p-4 dark:bg-surface-900"
    :class="{ 'md:col-span-2': wide }"
    :aria-label="title"
    :data-ps-demo="demoOf"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-medium text-muted-color">
        {{ title }}
      </h3>
      <Button
        v-if="studio"
        label="Customize"
        icon="pi pi-sliders-h"
        size="small"
        text
        class="!-my-1 !py-0.5 !text-xs"
        @click="customize"
      />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <slot />
    </div>
  </section>
</template>

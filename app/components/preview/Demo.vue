<script setup lang="ts">
// One component demo in the gallery: a title and the live component.
const props = defineProps<{ title: string, wide?: boolean }>()

// Components named in the title ('Badge · OverlayBadge' → 'badge overlaybadge'), so the editor
// can reveal components that only render on demand (dialogs, popovers, tooltips) by their demo.
const demoOf = computed(() => props.title.split('·').map(part => part.trim().split(/[\s(]/)[0]!.toLowerCase()).join(' '))
</script>

<template>
  <section
    class="flex min-w-0 flex-col gap-3 rounded-xl border border-surface bg-surface-0 p-4 dark:bg-surface-900"
    :class="{ 'md:col-span-2': wide }"
    :aria-label="title"
    :data-ps-demo="demoOf"
  >
    <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
      {{ title }}
    </h3>
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <slot />
    </div>
  </section>
</template>

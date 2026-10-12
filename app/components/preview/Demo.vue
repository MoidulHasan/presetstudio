<script setup lang="ts">
// One component demo in the gallery: a title and the live component.
defineProps<{ title: string, wide?: boolean }>()
</script>

<template>
  <section
    class="flex min-w-0 flex-col gap-3 rounded-xl border border-surface bg-surface-0 p-4 dark:bg-surface-900"
    :class="{ 'md:col-span-2': wide }"
    :aria-label="title"
  >
    <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
      {{ title }}
    </h3>
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <slot />
    </div>
  </section>
</template>

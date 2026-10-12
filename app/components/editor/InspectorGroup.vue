<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <section class="flex flex-col gap-3">
    <header class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-sm font-semibold">
          {{ title }}
        </h3>
        <p
          v-if="description"
          class="mt-0.5 text-xs text-surface-500 dark:text-surface-400"
        >
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

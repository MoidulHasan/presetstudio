<script setup lang="ts">
// A titled block of controls. The description is an explanation on demand (ⓘ), not a line of
// gray text under every title.
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <section class="flex flex-col gap-2">
    <header class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1">
        <h3 class="text-sm font-semibold">
          {{ title }}
        </h3>
        <EditorInfoTip
          v-if="description"
          :text="description"
          :subject="title"
        />
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

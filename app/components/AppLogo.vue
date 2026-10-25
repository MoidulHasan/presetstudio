<script setup lang="ts">
// The mark is a five-step gray scale: a palette, without a hue of its own, so the theme being
// designed (or the color a visitor picks on the landing page) is the only color on screen.
// Fixed colors, so it never follows the editor's or the preview's theme; dark mode steps the
// other way.
const STEPS = [
  'bg-[#d4d4d8] dark:bg-[#3f3f46]',
  'bg-[#a1a1aa] dark:bg-[#71717a]',
  'bg-[#71717a] dark:bg-[#a1a1aa]',
  'bg-[#3f3f46] dark:bg-[#d4d4d8]',
  'bg-[#18181b] dark:bg-[#fafafa]',
]
</script>

<template>
  <NuxtLink
    to="/"
    class="flex shrink-0 items-center gap-2.5 whitespace-nowrap font-semibold tracking-tight"
  >
    <span
      class="flex h-5 gap-px overflow-hidden rounded-[3px]"
      aria-hidden="true"
    >
      <span
        v-for="step in STEPS"
        :key="step"
        class="w-[5px]"
        :class="step"
      />
    </span>
    Preset Studio
  </NuxtLink>
</template>

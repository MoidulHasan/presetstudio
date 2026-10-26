<script setup lang="ts">
import { BRAND_RAMP } from '~/utils/logo'

// The mark is a five-step scale in the colors of the theme on screen (`useLogoColors` sets
// --ps-logo-1…5 on <html>): the color picked on the landing page, the theme open in the editor.
// Elsewhere it shows the brand ramp.
const bars = BRAND_RAMP.map((fallback, index) => `var(--ps-logo-${index + 1}, ${fallback})`)
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
        v-for="(color, index) in bars"
        :key="index"
        class="w-[5px] transition-colors duration-500 motion-reduce:transition-none"
        :style="{ backgroundColor: color, transitionDelay: `${index * 30}ms` }"
      />
    </span>
    Preset Studio
  </NuxtLink>
</template>

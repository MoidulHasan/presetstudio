<script setup lang="ts">
useSeoMeta({
  title: 'Docs · Preset Studio',
  description: 'Documentation for Preset Studio, the visual preset generator for PrimeVue 4.',
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16">
    <h1 class="mb-4 text-3xl font-bold">
      Docs
    </h1>
    <p class="mb-6 text-surface-600 dark:text-surface-300">
      Documentation is coming soon. Until then, open the editor, design your preset and use the
      exported code like this:
    </p>
    <pre class="overflow-x-auto rounded-lg bg-surface-100 p-4 text-sm dark:bg-surface-900"><code>import PrimeVue from 'primevue/config'
import MyPreset from './my-preset'

app.use(PrimeVue, {
  theme: { preset: MyPreset },
})</code></pre>
  </div>
</template>

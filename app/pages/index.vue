<script setup lang="ts">
import { REPO_URL } from '~/utils/site'

useSeoMeta({
  title: 'Preset Studio: visual theme generator for PrimeVue',
  description: 'Design PrimeVue 4 presets visually: pick a base preset, generate color palettes, preview live and export ready-to-paste definePreset code. Free and open source.',
})

const features = [
  { icon: 'pi pi-palette', title: 'Palettes from one color', text: 'Pick a primary color and get a full 50–950 scale, applied live.' },
  { icon: 'pi pi-eye', title: 'Isolated live preview', text: 'See real components, light and dark, without affecting the editor UI.' },
  { icon: 'pi pi-code', title: 'Ready-to-paste export', text: 'Copy a definePreset(...) module that drops straight into your app.' },
  { icon: 'pi pi-lock-open', title: 'Free and MIT-licensed', text: 'Runs in your browser. No account, no paywall.' },
]
</script>

<template>
  <div>
    <section class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <span class="rounded-full border border-surface-200 px-3 py-1 text-xs text-surface-500 dark:border-surface-700">
        Open source · For PrimeVue 4
      </span>
      <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
        Design your PrimeVue theme visually
      </h1>
      <p class="max-w-xl text-lg text-surface-600 dark:text-surface-300">
        Preset Studio is a free, open-source preset generator for PrimeVue&nbsp;4.
        Pick a base preset, tune your colors, preview real components and export the code.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          v-slot="{ navigate, href }"
          to="/editor"
          custom
        >
          <Button
            as="a"
            :href="href"
            label="Open editor"
            icon="pi pi-arrow-right"
            icon-pos="right"
            size="large"
            @click="navigate"
          />
        </NuxtLink>
        <Button
          as="a"
          :href="REPO_URL"
          target="_blank"
          rel="noopener"
          label="GitHub"
          icon="pi pi-github"
          severity="secondary"
          size="large"
          outlined
        />
      </div>
    </section>

    <section class="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="rounded-xl border border-surface-200 p-6 dark:border-surface-800"
      >
        <i
          :class="feature.icon"
          class="mb-3 text-xl text-primary"
          aria-hidden="true"
        />
        <h2 class="mb-1 font-semibold">
          {{ feature.title }}
        </h2>
        <p class="text-sm text-surface-600 dark:text-surface-300">
          {{ feature.text }}
        </p>
      </div>
    </section>
  </div>
</template>

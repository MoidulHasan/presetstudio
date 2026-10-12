<script setup lang="ts">
import { definePreset, usePreset } from '@primeuix/themes'
import type { Preset } from '@primeuix/themes/types'
import { buildPresetOverrides } from '~/utils/theme/build'
import { createReadyMessage, parseEditorMessage, type PreviewCategory, type PreviewTemplate } from '~/utils/theme/messages'
import { loadBasePreset } from '~/utils/theme/presets'
import { createDefaultThemeState, type ColorScheme, type ThemeState, type TokenTree } from '~/utils/theme/types'

// Rendered only inside the /editor iframe. Has its own PrimeVue instance, so the
// theme applied here never leaks into the editor UI.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Preview · Preset Studio', robots: 'noindex, nofollow' })

const embedded = import.meta.client && window.parent !== window

const template = ref<PreviewTemplate>('components')
const category = ref<PreviewCategory>('form')
// Until the first theme arrives the app's default (editor) theme is active; don't show it.
const themed = ref(false)

let applyId = 0
async function applyTheme(state: ThemeState, colorScheme: ColorScheme) {
  const id = ++applyId
  const base = await loadBasePreset(state.basePreset)
  // A newer state arrived while the base preset was loading.
  if (id !== applyId) return
  // usePreset (not updatePreset) so switching base presets or removing overrides
  // never leaves stale tokens behind.
  usePreset(definePreset(base, buildPresetOverrides(state, base as unknown as TokenTree) as Preset))
  document.documentElement.classList.toggle('ps-dark', colorScheme === 'dark')
  themed.value = true
}

function onMessage(event: MessageEvent) {
  if (event.source !== window.parent) return
  const message = parseEditorMessage(event, window.location.origin)
  if (message?.type !== 'theme:apply') return
  template.value = message.template
  category.value = message.category
  void applyTheme(message.state, message.colorScheme)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  if (embedded) window.parent.postMessage(createReadyMessage(), window.location.origin)
  else void applyTheme(createDefaultThemeState(), 'light')
})
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div
    class="min-h-screen bg-surface-50 p-6 text-surface-700 transition-opacity duration-150 dark:bg-surface-950 dark:text-surface-200"
    :class="themed ? 'opacity-100' : 'opacity-0'"
  >
    <Message
      v-if="!embedded"
      severity="info"
      class="mb-6"
    >
      This page is the live preview for the
      <NuxtLink
        to="/editor"
        class="underline"
      >Preset Studio editor</NuxtLink> and is meant to be shown inside it.
    </Message>
    <PreviewDashboard v-if="template === 'dashboard'" />
    <PreviewForm v-else-if="template === 'form'" />
    <PreviewSettings v-else-if="template === 'settings'" />
    <PreviewGallery
      v-else
      :category="embedded ? category : undefined"
    />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { definePreset, usePreset } from '@primeuix/themes'
import type { Preset } from '@primeuix/themes/types'
import { buildPresetOverrides } from '~/utils/theme/build'
import { createReadyMessage, parseEditorMessage } from '~/utils/theme/messages'
import { loadBasePreset } from '~/utils/theme/presets'
import { createDefaultThemeState, type ThemeState } from '~/utils/theme/types'

// Rendered only inside the /editor iframe. Has its own PrimeVue instance, so the
// theme applied here never leaks into the editor UI.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Preview · Preset Studio', robots: 'noindex, nofollow' })

const embedded = import.meta.client && window.parent !== window

let applyId = 0
async function applyTheme(state: ThemeState) {
  const id = ++applyId
  const base = await loadBasePreset(state.basePreset)
  // A newer state arrived while the base preset was loading.
  if (id !== applyId) return
  // usePreset (not updatePreset) so switching base presets or removing overrides
  // never leaves stale tokens behind.
  usePreset(definePreset(base, buildPresetOverrides(state) as Preset))
  document.documentElement.classList.toggle('ps-dark', state.colorScheme === 'dark')
}

function onMessage(event: MessageEvent) {
  if (event.source !== window.parent) return
  const message = parseEditorMessage(event, window.location.origin)
  if (message?.type === 'theme:apply') void applyTheme(message.state)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  if (embedded) window.parent.postMessage(createReadyMessage(), window.location.origin)
  else void applyTheme(createDefaultThemeState())
})
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div class="min-h-screen bg-surface-50 p-6 text-surface-700 dark:bg-surface-950 dark:text-surface-200">
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
    <PreviewGallery />
  </div>
</template>

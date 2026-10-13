<script setup lang="ts">
import { definePreset, usePreset } from '@primeuix/themes'
import type { Preset } from '@primeuix/themes/types'
import { buildPresetOverrides } from '~/utils/theme/build'
import {
  createInspectMessage,
  createReadyMessage,
  createRevealedMessage,
  createScrollMessage,
  parseEditorMessage,
  type PreviewCategory,
  type PreviewTemplate,
  type ScrollPosition,
} from '~/utils/theme/messages'
import { forcedFocusCss } from '~/utils/theme/focus-preview'
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

// --- Scroll sync (side-by-side panes) ---------------------------------------------
// Report user scrolls to the editor, which mirrors them to the other pane. Scrolls
// performed on the editor's behalf aren't reported back, to avoid ping-pong.
let programmatic: ScrollPosition | null = null
let scrollFrame = 0

const near = (a: ScrollPosition, b: ScrollPosition) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2

function onScroll() {
  cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(() => {
    const position = { x: window.scrollX, y: window.scrollY }
    const echo = programmatic && near(programmatic, position)
    programmatic = null
    if (!echo) window.parent.postMessage(createScrollMessage(position), window.location.origin)
  })
}

function scrollTo(position: ScrollPosition) {
  if (near(position, { x: window.scrollX, y: window.scrollY })) return
  programmatic = position
  window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' })
}

// --- Focus states ----------------------------------------------------------------
// Focus styles only apply to the focused element. To show every component's focus ring
// at once, copies of the :focus / :focus-visible rules are scoped to a class on <html>,
// rebuilt whenever component styles are added or the theme changes.
const FOCUS_CLASS = 'ps-show-focus'
let focusStyle: HTMLStyleElement | null = null
let focusObserver: MutationObserver | null = null
let focusTimer: ReturnType<typeof setTimeout> | undefined

function buildFocusStyles() {
  if (!focusStyle) return
  const css = Array.from(document.querySelectorAll('style'))
    .filter(style => style !== focusStyle)
    .map(style => forcedFocusCss(style.textContent ?? '', `.${FOCUS_CLASS}`))
    .filter(Boolean)
    .join('\n')
  if (focusStyle.textContent !== css) focusStyle.textContent = css
}

function setShowFocus(on: boolean) {
  document.documentElement.classList.toggle(FOCUS_CLASS, on)
  if (on && !focusStyle) {
    focusStyle = document.createElement('style')
    focusStyle.dataset.psFocusStates = ''
    document.head.appendChild(focusStyle)
    focusObserver = new MutationObserver((records) => {
      if (records.every(r => r.target === focusStyle)) return
      clearTimeout(focusTimer)
      focusTimer = setTimeout(buildFocusStyles, 50)
    })
    focusObserver.observe(document.head, { childList: true, subtree: true, characterData: true })
    buildFocusStyles()
  }
  else if (!on && focusStyle) {
    focusObserver?.disconnect()
    focusStyle.remove()
    focusStyle = null
    focusObserver = null
    clearTimeout(focusTimer)
  }
}

// --- Component inspection ----------------------------------------------------------
const inspector = usePreviewInspector((component) => {
  window.parent.postMessage(createInspectMessage(component), window.location.origin)
})

async function reveal(component: string) {
  const { found, uses } = await inspector.reveal(component)
  window.parent.postMessage(createRevealedMessage(component, found, uses), window.location.origin)
}

function onMessage(event: MessageEvent) {
  if (event.source !== window.parent) return
  const message = parseEditorMessage(event, window.location.origin)
  if (message?.type === 'preview:scroll-to') return scrollTo(message)
  if (message?.type === 'preview:reveal') return void reveal(message.component)
  if (message?.type !== 'theme:apply') return
  template.value = message.template
  category.value = message.category
  document.documentElement.classList.toggle('ps-no-scrollbar', message.hideScrollbar)
  setShowFocus(message.showFocus)
  inspector.setInspect(message.inspect)
  void applyTheme(message.state, message.colorScheme)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  if (embedded) {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.parent.postMessage(createReadyMessage(), window.location.origin)
  }
  else {
    void applyTheme(createDefaultThemeState(), 'light')
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(scrollFrame)
  setShowFocus(false)
  inspector.dispose()
})
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

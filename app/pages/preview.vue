<script setup lang="ts">
import { definePreset, usePreset } from '@primeuix/themes'
import type { Preset } from '@primeuix/themes/types'
import { buildPresetOverrides } from '~/utils/theme/build'
import {
  createInspectMessage,
  createReadyMessage,
  createRevealedMessage,
  createScrollMessage,
  createShortcutMessage,
  createStagePickMessage,
  parseEditorMessage,
  type PreviewCategory,
  type PreviewShortcut,
  type PreviewTemplate,
  type ScrollPosition,
} from '~/utils/theme/messages'
import { PREVIEW_BOTH, PREVIEW_SCHEME } from '~/composables/usePreviewForcedStyles'
import { PICK_EVENT } from '~/plugins/pick'
import { loadBasePreset } from '~/utils/theme/presets'
import { createDefaultThemeState, type ColorScheme, type ThemeState, type TokenTree } from '~/utils/theme/types'

// Rendered only inside the /editor iframe. Has its own PrimeVue instance, so the
// theme applied here never leaks into the editor UI.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Preview · Preset Studio', robots: 'noindex, nofollow' })

const embedded = import.meta.client && window.parent !== window

const template = ref<PreviewTemplate>('components')
const category = ref<PreviewCategory>('form')
// The editor's mode: stages show this scheme, or both with "Both".
const colorScheme = ref<ColorScheme>('light')
provide(PREVIEW_SCHEME, readonly(colorScheme))
const bothSchemes = ref(false)
provide(PREVIEW_BOTH, readonly(bothSchemes))
// Until the first theme arrives the app's default (editor) theme is active; don't show it.
const themed = ref(false)

let applyId = 0
async function applyTheme(state: ThemeState, colorScheme: ColorScheme) {
  const id = ++applyId
  let base: Preset
  try {
    base = await loadBasePreset(state.basePreset)
  }
  catch (error) {
    // Keep showing the last theme; the editor reports the failure and offers a reload.
    console.error(`Couldn't load the ${state.basePreset} preset`, error)
    return
  }
  // A newer state arrived while the base preset was loading.
  if (id !== applyId) return
  // usePreset (not updatePreset) so switching base presets or removing overrides
  // never leaves stale tokens behind.
  usePreset(definePreset(base, buildPresetOverrides(state, base as unknown as TokenTree) as Preset))
  // The stage shows light and dark side by side itself.
  document.documentElement.classList.toggle('ps-dark', colorScheme === 'dark' && !stage.value)
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

// --- Forced states and scheme scopes (focus-states toggle, component stage) --------
const forced = usePreviewForcedStyles()
const stage = ref<string | null>(null)

// --- Component inspection ----------------------------------------------------------
const inspector = usePreviewInspector((component) => {
  window.parent.postMessage(createInspectMessage(component), window.location.origin)
})

// Stage elements tagged with v-pick report clicks (the innermost one); the editor opens its control.
function onPick(event: Event) {
  const target = (event as CustomEvent<unknown>).detail
  if (typeof target === 'string') window.parent.postMessage(createStagePickMessage(target), window.location.origin)
}

// --- Pointing at things (the editor's hovered control, the section's spotlight) ------------
const highlight = usePreviewHighlight()
const spotlight = usePreviewSpotlight()

async function reveal(component: string) {
  const { found, uses } = await inspector.reveal(component)
  window.parent.postMessage(createRevealedMessage(component, found, uses), window.location.origin)
}

// --- Editor shortcuts ---------------------------------------------------------------
// Key presses in the iframe don't reach the editor: pass on search, undo/redo (outside text
// fields, which keep their own undo) and Escape while picking.
let inspecting = false

function shortcutFor(event: KeyboardEvent): PreviewShortcut | null {
  if (event.key === 'Escape') return inspecting ? 'stop-pick' : null
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null
  const key = event.key.toLowerCase()
  if (key === 'k' && !event.shiftKey) return 'search'
  const el = event.target as HTMLElement | null
  if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return null
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y') return 'redo'
  return null
}

function onKeydown(event: KeyboardEvent) {
  const shortcut = shortcutFor(event)
  if (!shortcut) return
  event.preventDefault()
  window.parent.postMessage(createShortcutMessage(shortcut), window.location.origin)
}

function onMessage(event: MessageEvent) {
  if (event.source !== window.parent) return
  const message = parseEditorMessage(event, window.location.origin)
  if (message?.type === 'preview:scroll-to') return scrollTo(message)
  if (message?.type === 'preview:reveal') return void reveal(message.component)
  if (message?.type === 'preview:highlight') return highlight.show(message.target, message.mode)
  if (message?.type === 'preview:spotlight') return spotlight.set(message.components)
  if (message?.type !== 'theme:apply') return
  template.value = message.template
  category.value = message.category
  colorScheme.value = message.colorScheme
  bothSchemes.value = message.bothSchemes
  document.documentElement.classList.toggle('ps-no-scrollbar', message.hideScrollbar)
  stage.value = message.stage
  forced.update({ focus: message.showFocus, stage: !!message.stage })
  inspector.setInspect(message.inspect)
  inspecting = message.inspect
  void applyTheme(message.state, message.colorScheme)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  document.addEventListener(PICK_EVENT, onPick)
  if (embedded) {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKeydown, true)
    window.parent.postMessage(createReadyMessage(), window.location.origin)
  }
  else {
    void applyTheme(createDefaultThemeState(), 'light')
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  document.removeEventListener(PICK_EVENT, onPick)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown, true)
  cancelAnimationFrame(scrollFrame)
  forced.dispose()
  inspector.dispose()
  highlight.dispose()
  spotlight.dispose()
})
</script>

<template>
  <div
    class="min-h-screen bg-surface-50 p-4 text-surface-700 transition-opacity duration-150 dark:bg-surface-950 dark:text-surface-200"
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
    <PreviewStageButton
      v-if="stage === 'button'"
    />
    <PreviewStageMessage
      v-else-if="stage === 'message'"
    />
    <PreviewStageToast
      v-else-if="stage === 'toast'"
    />
    <PreviewStageTag
      v-else-if="stage === 'tag'"
    />
    <PreviewStageBadge
      v-else-if="stage === 'badge'"
    />
    <PreviewStageDataTable
      v-else-if="stage === 'datatable'"
    />
    <PreviewStageFoundation
      v-else-if="stage?.startsWith('foundation-')"
      :stage="stage"
    />
    <PreviewStageSemantic
      v-else-if="stage?.startsWith('semantic-')"
      :stage="stage"
    />
    <PreviewDashboard v-else-if="template === 'dashboard'" />
    <PreviewForm v-else-if="template === 'form'" />
    <PreviewSettings v-else-if="template === 'settings'" />
    <PreviewGallery
      v-else
      :category="embedded ? category : undefined"
    />
    <Toast />
  </div>
</template>

<style>
/* Stage parts that open a control (v-pick): they point, and the innermost one hovered is outlined. */
[data-ps-pick] {
  cursor: pointer;
}

[data-ps-pick]:hover:not(:has([data-ps-pick]:hover)) {
  outline: 1px dashed rgba(37, 99, 235, 0.65);
  outline-offset: 3px;
}

html.ps-inspecting [data-ps-pick]:hover {
  outline: none;
}
</style>

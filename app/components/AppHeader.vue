<script setup lang="ts">
import { NuxtLink } from '#components'
import { REPO_URL } from '~/utils/site'

// Site header (landing and docs): in the content column, so the logo lines up with the page.
// It stays at the top while scrolling, so the editor is always one click away; its border only
// shows once the page has scrolled under it. Docs come back once there are docs to read.
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 4)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b bg-surface-0 transition-colors duration-200 motion-reduce:transition-none"
    :class="scrolled ? 'border-surface-200' : 'border-transparent'"
  >
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <AppLogo />
      <nav
        class="flex items-center gap-2"
        aria-label="Main"
      >
        <Button
          v-tooltip.bottom="'Source on GitHub'"
          as="a"
          :href="REPO_URL"
          target="_blank"
          rel="noopener"
          icon="pi pi-github"
          severity="secondary"
          size="small"
          text
          rounded
          aria-label="Source on GitHub (opens in a new tab)"
        />
        <Button
          :as="NuxtLink"
          to="/editor"
          label="Open editor"
          size="small"
        />
      </nav>
    </div>
  </header>
</template>

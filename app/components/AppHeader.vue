<script setup lang="ts">
import { REPO_URL } from '~/utils/site'
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-surface-200 px-4 dark:border-surface-800">
    <AppLogo />
    <nav class="flex items-center gap-1 text-sm">
      <NuxtLink
        to="/editor"
        class="rounded-md px-3 py-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        Editor
      </NuxtLink>
      <NuxtLink
        to="/docs"
        class="rounded-md px-3 py-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        Docs
      </NuxtLink>
      <a
        :href="REPO_URL"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"
      >
        <i
          class="pi pi-github"
          aria-hidden="true"
        />
        GitHub
      </a>
    </nav>
  </header>
</template>

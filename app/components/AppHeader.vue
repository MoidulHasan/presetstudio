<script setup lang="ts">
import { NuxtLink } from '#components'
import { REPO_URL } from '~/utils/site'
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-surface-200 px-4 dark:border-surface-800">
    <AppLogo />
    <nav class="flex items-center gap-1">
      <Button
        :as="NuxtLink"
        to="/editor"
        label="Editor"
        severity="secondary"
        size="small"
        text
      />
      <Button
        :as="NuxtLink"
        to="/docs"
        label="Docs"
        severity="secondary"
        size="small"
        text
      />
      <Button
        as="a"
        :href="REPO_URL"
        target="_blank"
        rel="noopener"
        label="GitHub"
        icon="pi pi-github"
        severity="secondary"
        size="small"
        text
      />
    </nav>
  </header>
</template>

<script setup lang="ts">
import { DISCLAIMER, REPO_URL } from '~/utils/site'
</script>

<template>
  <footer class="border-t border-surface-200 px-4 py-8 text-sm text-surface-500 dark:border-surface-800 dark:text-surface-400">
    <div class="mx-auto flex max-w-5xl flex-col gap-3">
      <p>
        Preset Studio is open source under the MIT license.
        <a
          :href="REPO_URL"
          target="_blank"
          rel="noopener"
          class="underline hover:text-primary"
        >Source on GitHub</a>.
      </p>
      <p>{{ DISCLAIMER }}</p>
    </div>
  </footer>
</template>

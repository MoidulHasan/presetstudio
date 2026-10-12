<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

const visible = defineModel<boolean>('visible', { required: true })

const store = useEditorStore()
const toast = useToast()

async function copy() {
  try {
    await navigator.clipboard.writeText(store.exportCode)
    toast.add({ severity: 'success', summary: 'Copied to clipboard', life: 2000 })
  }
  catch {
    toast.add({ severity: 'error', summary: 'Copy failed', detail: 'Select the code and copy it manually.', life: 4000 })
  }
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    header="Export preset"
    class="!w-full md:!w-[40rem]"
  >
    <div class="flex h-full flex-col gap-4">
      <p class="text-sm text-surface-600 dark:text-surface-300">
        Save this as <code class="font-mono">my-preset.ts</code> and pass it to PrimeVue:
        <code class="font-mono">app.use(PrimeVue, { theme: { preset: MyPreset } })</code>.
      </p>
      <div class="flex justify-end">
        <Button
          label="Copy code"
          icon="pi pi-copy"
          size="small"
          @click="copy"
        />
      </div>
      <pre
        class="min-h-0 flex-1 overflow-auto rounded-lg bg-surface-100 p-4 text-xs leading-relaxed dark:bg-surface-800"
        aria-label="Generated preset code"
      ><code>{{ store.exportCode }}</code></pre>
    </div>
  </Drawer>
</template>

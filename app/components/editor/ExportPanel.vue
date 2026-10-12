<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { generateNuxtSnippets, generateVueSnippet } from '~/utils/theme/export'

const visible = defineModel<boolean>('visible', { required: true })

const store = useEditorStore()
const toast = useToast()
const tab = ref('preset')

interface Snippet {
  title: string
  fileName: string
  code: string
  download?: boolean
}

const snippets = computed<Record<string, Snippet[]>>(() => {
  const { identifier, fileBase, code } = store.exportInfo
  const nuxt = generateNuxtSnippets(identifier, fileBase)
  return {
    preset: [{ title: 'Preset', fileName: `${fileBase}.ts`, code, download: true }],
    nuxt: [
      { title: '1. Preset', fileName: `themes/${fileBase}.ts`, code, download: true },
      { title: '2. Theme module', fileName: 'themes/theme.ts', code: nuxt.themeFile, download: true },
      { title: '3. Nuxt config', fileName: 'nuxt.config.ts', code: nuxt.config },
    ],
    vue: [
      { title: '1. Preset', fileName: `themes/${fileBase}.ts`, code, download: true },
      { title: '2. Register', fileName: 'main.ts', code: generateVueSnippet(identifier, fileBase) },
    ],
  }
})

async function copy(snippet: Snippet) {
  try {
    await navigator.clipboard.writeText(snippet.code)
    toast.add({ severity: 'success', summary: `Copied ${snippet.fileName}`, life: 2000 })
  }
  catch {
    toast.add({ severity: 'error', summary: 'Copy failed', detail: 'Select the code and copy it manually.', life: 4000 })
  }
}

function download(snippet: Snippet) {
  const url = URL.createObjectURL(new Blob([snippet.code], { type: 'text/typescript' }))
  const link = document.createElement('a')
  link.href = url
  link.download = snippet.fileName.split('/').pop()!
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    class="!w-full md:!w-[44rem]"
  >
    <template #header>
      <div class="flex flex-col">
        <span class="text-lg font-semibold">Export “{{ store.activeDoc.name }}”</span>
        <span class="text-xs text-surface-500 dark:text-surface-400">
          {{ store.exportInfo.tokenCount }} changed token{{ store.exportInfo.tokenCount === 1 ? '' : 's' }}
          on top of {{ store.theme.basePreset.charAt(0).toUpperCase() + store.theme.basePreset.slice(1) }}.
          Only changes are exported; everything else comes from the base preset.
        </span>
      </div>
    </template>

    <Tabs v-model:value="tab">
      <TabList>
        <Tab value="preset">
          Preset file
        </Tab>
        <Tab value="nuxt">
          Nuxt
        </Tab>
        <Tab value="vue">
          Vue
        </Tab>
      </TabList>
      <TabPanels class="!px-0">
        <TabPanel
          v-for="(list, key) in snippets"
          :key="key"
          :value="key"
        >
          <div class="flex flex-col gap-6">
            <section
              v-for="snippet in list"
              :key="snippet.fileName"
              class="flex flex-col gap-2"
            >
              <header class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 flex-col">
                  <span
                    v-if="list.length > 1"
                    class="text-sm font-medium"
                  >{{ snippet.title }}</span>
                  <code class="truncate font-mono text-xs text-surface-500">{{ snippet.fileName }}</code>
                </div>
                <div class="flex shrink-0 gap-1">
                  <Button
                    v-if="snippet.download"
                    v-tooltip.bottom="`Download ${snippet.fileName.split('/').pop()}`"
                    icon="pi pi-download"
                    severity="secondary"
                    size="small"
                    text
                    :aria-label="`Download ${snippet.fileName}`"
                    @click="download(snippet)"
                  />
                  <Button
                    label="Copy"
                    icon="pi pi-copy"
                    size="small"
                    :severity="list.length > 1 ? 'secondary' : undefined"
                    @click="copy(snippet)"
                  />
                </div>
              </header>
              <pre
                class="max-h-[60vh] overflow-auto rounded-lg bg-surface-100 p-4 font-mono text-xs leading-relaxed dark:bg-surface-800"
                :aria-label="`${snippet.fileName} code`"
                tabindex="0"
              ><code>{{ snippet.code }}</code></pre>
            </section>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Drawer>
</template>

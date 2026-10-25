<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { generateNuxtSnippets, generateVueSnippet } from '~/utils/theme/export'
import { encodeShareToken, shareUrl, themeFile } from '~/utils/theme/share'

const visible = defineModel<boolean>('visible', { required: true })

const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()
const tab = defineModel<string>('tab', { default: 'preset' })

interface Snippet {
  title: string
  fileName: string
  code: string
  download?: boolean
}

const snippets = computed<Record<string, Snippet[]>>(() => {
  const { identifier, fileBase, code } = preset.exportInfo
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

function saveFile(fileName: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function download(snippet: Snippet) {
  saveFile(snippet.fileName.split('/').pop()!, snippet.code, 'text/typescript')
}

// --- Share: a link that carries the theme, or a theme file ---------------------------------
/** Links longer than this get cut by some chat apps and mail clients. */
const LONG_LINK = 2000
const shareLink = ref<string | null>(null)
let shareRun = 0
watch([visible, tab, () => workspace.theme, () => workspace.activeDoc.name], async () => {
  if (!visible.value || tab.value !== 'share') return
  const run = ++shareRun
  const token = await encodeShareToken(workspace.activeDoc.name, workspace.theme)
  if (run === shareRun) shareLink.value = shareUrl(window.location.origin, token)
}, { immediate: true })

async function copyLink() {
  if (!shareLink.value) return
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.add({ severity: 'success', summary: 'Share link copied', life: 2000 })
  }
  catch {
    toast.add({ severity: 'error', summary: 'Copy failed', detail: 'Select the link and copy it manually.', life: 4000 })
  }
}

function downloadThemeFile() {
  saveFile(`${preset.exportInfo.fileBase}.presetstudio.json`, themeFile(workspace.activeDoc.name, workspace.theme), 'application/json')
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
        <span class="text-lg font-semibold">Export “{{ workspace.activeDoc.name }}”</span>
        <span class="text-xs text-surface-500 dark:text-surface-400">
          {{ preset.exportInfo.tokenCount }} changed token{{ preset.exportInfo.tokenCount === 1 ? '' : 's' }}
          on top of {{ workspace.theme.basePreset.charAt(0).toUpperCase() + workspace.theme.basePreset.slice(1) }}.
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
        <Tab value="share">
          Share
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
        <TabPanel value="share">
          <div class="flex flex-col gap-8">
            <section class="flex flex-col gap-3">
              <header class="flex flex-col gap-1">
                <h3 class="text-sm font-semibold">
                  Share link
                </h3>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  Opening it in Preset Studio offers to add a copy of this theme. The theme travels inside
                  the link itself: nothing is uploaded, and later edits here don't change it.
                </p>
              </header>
              <div class="flex min-w-0 items-center gap-2">
                <InputText
                  :model-value="shareLink ?? ''"
                  readonly
                  aria-label="Share link"
                  size="small"
                  class="min-w-0 flex-1 font-mono !text-xs"
                  @focus="($event.target as HTMLInputElement).select()"
                />
                <Button
                  label="Copy link"
                  icon="pi pi-link"
                  size="small"
                  :disabled="!shareLink"
                  @click="copyLink"
                />
              </div>
              <Message
                v-if="shareLink && shareLink.length > LONG_LINK"
                severity="warn"
                size="small"
                variant="simple"
              >
                This link is long ({{ shareLink.length.toLocaleString() }} characters); some chat apps and mail clients cut long links. The theme file always works.
              </Message>
            </section>

            <section class="flex flex-col gap-3">
              <header class="flex flex-col gap-1">
                <h3 class="text-sm font-semibold">
                  Theme file
                </h3>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  The theme as a file, to keep or send. Open it in Preset Studio with
                  <span class="font-medium">Theme actions → Import theme file</span>.
                </p>
              </header>
              <div>
                <Button
                  :label="`Download ${preset.exportInfo.fileBase}.presetstudio.json`"
                  icon="pi pi-download"
                  severity="secondary"
                  size="small"
                  @click="downloadThemeFile"
                />
              </div>
            </section>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Drawer>
</template>

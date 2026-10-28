<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { listChanges } from '~/utils/theme/changes'
import { generateNuxtSnippets, generateVueSnippet } from '~/utils/theme/export'
import { encodeShareToken, shareUrl, themeFile } from '~/utils/theme/share'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'
import { readStorage, writeStorage } from '~/utils/storage'

// The finish line: what's in the theme, then numbered steps to add it to an app (Nuxt, Vue or
// just the preset file), or a link / file to share it.
const visible = defineModel<boolean>('visible', { required: true })
/** 'app' (add to your app) or 'share'. */
const tab = defineModel<string>('tab', { default: 'app' })

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()

// --- Summary ------------------------------------------------------------------------------
const changeCount = computed(() => listChanges(workspace.theme).length)
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

function reviewContrast() {
  visible.value = false
  editor.openSection('accessibility')
}

// --- Add to your app ------------------------------------------------------------------------
type Setup = 'nuxt' | 'vue' | 'file'
const SETUP_KEY = 'presetstudio:export-setup'
const SETUPS: Array<{ value: Setup, label: string }> = [
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'vue', label: 'Vue' },
  { value: 'file', label: 'Preset file only' },
]
const stored = readStorage(SETUP_KEY)
const setup = ref<Setup>(SETUPS.some(s => s.value === stored) ? stored as Setup : 'nuxt')
watch(setup, value => writeStorage(SETUP_KEY, value))

interface Snippet {
  title: string
  /** What the step is for, in one line. */
  hint: string
  fileName: string
  code: string
  download?: boolean
}

const steps = computed<Snippet[]>(() => {
  const { identifier, fileBase, code } = preset.exportInfo
  const presetStep = (fileName: string): Snippet => ({
    title: 'Save the preset',
    hint: `Your theme as a PrimeVue preset: only what you changed, on top of ${baseLabel.value}.`,
    fileName,
    code,
    download: true,
  })
  if (setup.value === 'nuxt') {
    const nuxt = generateNuxtSnippets(identifier, fileBase)
    return [
      presetStep(`themes/${fileBase}.ts`),
      { title: 'Wrap it for the PrimeVue module', hint: 'The Nuxt module takes the preset together with its options (dark mode follows the system here). On Nuxt 4 both files go in app/themes/, where ~ points.', fileName: 'themes/theme.ts', code: nuxt.themeFile, download: true },
      { title: 'Point Nuxt at it', hint: 'Add these lines to your Nuxt config, next to your other settings.', fileName: 'nuxt.config.ts', code: nuxt.config },
    ]
  }
  if (setup.value === 'vue') {
    return [
      presetStep(`themes/${fileBase}.ts`),
      { title: 'Register it with PrimeVue', hint: 'Where you create your app, usually main.ts.', fileName: 'main.ts', code: generateVueSnippet(identifier, fileBase) },
    ]
  }
  return [{ ...presetStep(`${fileBase}.ts`), hint: 'Use it wherever you configure PrimeVue: theme: { preset }.' }]
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
      <div class="flex min-w-0 flex-col gap-1">
        <span class="text-lg font-semibold">Export “{{ workspace.activeDoc.name }}”</span>
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
          <span>
            {{ changeCount }} change{{ changeCount === 1 ? '' : 's' }} on top of {{ baseLabel }}
            ({{ preset.exportInfo.tokenCount }} token{{ preset.exportInfo.tokenCount === 1 ? '' : 's' }}; everything else comes from {{ baseLabel }})
          </span>
          <span
            v-if="!preset.contrastIssues"
            class="flex items-center gap-1"
          >
            <i
              class="pi pi-check-circle text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
            Contrast checks pass
          </span>
          <Button
            v-else
            :label="`${preset.contrastIssues} contrast check${preset.contrastIssues === 1 ? '' : 's'} fail: review`"
            icon="pi pi-exclamation-triangle"
            severity="danger"
            size="small"
            text
            class="!p-0 !text-xs"
            @click="reviewContrast"
          />
        </span>
      </div>
    </template>

    <Tabs v-model:value="tab">
      <TabList>
        <Tab value="app">
          Add to your app
        </Tab>
        <Tab value="share">
          Share
        </Tab>
      </TabList>
      <TabPanels class="!px-0">
        <TabPanel value="app">
          <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-sm font-medium">Your setup</span>
              <SelectButton
                v-model="setup"
                :options="SETUPS"
                option-label="label"
                option-value="value"
                :allow-empty="false"
                aria-label="Your setup"
                size="small"
              />
            </div>

            <ol class="flex flex-col gap-6">
              <li
                v-for="(step, index) in steps"
                :key="`${setup}-${step.fileName}`"
                class="flex gap-3"
              >
                <span
                  class="grid size-6 shrink-0 place-items-center rounded-full bg-surface-900 text-xs font-semibold text-surface-0 dark:bg-surface-0 dark:text-surface-900"
                  aria-hidden="true"
                >{{ index + 1 }}</span>
                <section
                  class="flex min-w-0 flex-1 flex-col gap-2"
                  :aria-label="`Step ${index + 1}: ${step.title}`"
                >
                  <header class="flex items-start justify-between gap-2">
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <span class="text-sm font-semibold">{{ step.title }}</span>
                      <span class="text-xs text-surface-500 dark:text-surface-400">{{ step.hint }}</span>
                      <code class="truncate font-mono text-xs text-surface-500">{{ step.fileName }}</code>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <Button
                        v-if="step.download"
                        v-tooltip.bottom="`Download ${step.fileName.split('/').pop()}`"
                        icon="pi pi-download"
                        severity="secondary"
                        size="small"
                        text
                        :aria-label="`Download ${step.fileName}`"
                        @click="download(step)"
                      />
                      <Button
                        label="Copy"
                        icon="pi pi-copy"
                        size="small"
                        severity="secondary"
                        @click="copy(step)"
                      />
                    </div>
                  </header>
                  <pre
                    class="max-h-72 overflow-auto rounded-lg bg-surface-100 p-4 font-mono text-xs leading-relaxed dark:bg-surface-800"
                    :aria-label="`${step.fileName} code`"
                    tabindex="0"
                  ><code>{{ step.code }}</code></pre>
                </section>
              </li>
            </ol>

            <p class="flex items-center gap-2 border-t border-surface-200 pt-4 text-xs text-surface-500 dark:border-surface-700 dark:text-surface-400">
              <i
                class="pi pi-check"
                aria-hidden="true"
              />
              That's it: your app now uses “{{ workspace.activeDoc.name }}”. Works with PrimeVue 4 and @primeuix/themes 2.
            </p>
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

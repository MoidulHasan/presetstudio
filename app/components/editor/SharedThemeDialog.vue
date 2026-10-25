<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { decodeShareToken, shareTokenFromHash, startTokenFromHash, type SharedTheme } from '~/utils/theme/share'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'

// Opening a share link (/editor#theme=…) offers to add its theme as a new theme. The link is
// decoded locally and validated; the hash is cleared either way, so a reload doesn't ask again.
// The landing page's "Continue in the editor" (/editor#start=…) carries a look, brand color and
// corners into the setup: on a first visit they go into the untouched theme, otherwise they're
// offered as a new theme, so existing work is never replaced.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()

const shared = ref<SharedTheme | null>(null)
const starting = ref(false)

function clearHash() {
  history.replaceState(history.state, '', window.location.pathname + window.location.search)
}

async function readLink() {
  const startToken = startTokenFromHash(window.location.hash)
  const token = startToken ?? shareTokenFromHash(window.location.hash)
  if (!token) return
  clearHash()
  const theme = await decodeShareToken(token)
  if (!theme) {
    toast.add({ severity: 'error', summary: 'This share link doesn\'t work', detail: 'It may be incomplete (cut off when it was sent) or damaged.', life: 6000 })
    return
  }
  starting.value = !!startToken
  if (starting.value && preset.pristine && workspace.state.themes.length === 1) {
    workspace.update((draft) => {
      draft.basePreset = theme.theme.basePreset
      draft.design = theme.theme.design
      draft.overrides = theme.theme.overrides
    })
    editor.openSetup()
    return
  }
  shared.value = theme
}

function add() {
  if (!shared.value) return
  const doc = workspace.importTheme(shared.value.name, shared.value.theme)
  shared.value = null
  // Landing page choices continue in the setup; a shared theme is already designed.
  if (starting.value) editor.openSetup()
  else if (editor.setupOpen) editor.closeSetup()
  toast.add({ severity: 'success', summary: `Added “${doc.name}”`, detail: 'Your other themes are unchanged.', life: 3000 })
}

onMounted(() => {
  void readLink()
  window.addEventListener('hashchange', readLink)
})
onBeforeUnmount(() => window.removeEventListener('hashchange', readLink))
</script>

<template>
  <Dialog
    :visible="shared !== null"
    :header="starting ? 'Start a new theme' : 'Open a shared theme'"
    modal
    :style="{ width: '26rem' }"
    @update:visible="v => !v && (shared = null)"
  >
    <div
      v-if="shared"
      class="flex flex-col gap-4"
    >
      <p
        v-if="starting"
        class="text-sm"
      >
        Start a new {{ BASE_PRESET_LABELS[shared.theme.basePreset] }} theme with the choices you made? Your themes stay as they are.
      </p>
      <p
        v-else
        class="text-sm"
      >
        Add <span class="font-semibold">“{{ shared.name }}”</span>
        ({{ BASE_PRESET_LABELS[shared.theme.basePreset] }} based) as a new theme? Your themes stay as they are.
      </p>
      <div class="flex justify-end gap-2">
        <Button
          label="Not now"
          severity="secondary"
          text
          @click="shared = null"
        />
        <Button
          :label="starting ? 'Start theme' : 'Add theme'"
          icon="pi pi-plus"
          @click="add"
        />
      </div>
    </div>
  </Dialog>
</template>

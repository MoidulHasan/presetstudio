<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { decodeShareToken, shareTokenFromHash, type SharedTheme } from '~/utils/theme/share'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'

// Opening a share link (/editor#theme=…) offers to add its theme as a new theme. The link is
// decoded locally and validated; the hash is cleared either way, so a reload doesn't ask again.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const toast = useToast()

const shared = ref<SharedTheme | null>(null)

function clearHash() {
  history.replaceState(history.state, '', window.location.pathname + window.location.search)
}

async function readLink() {
  const token = shareTokenFromHash(window.location.hash)
  if (!token) return
  clearHash()
  const theme = await decodeShareToken(token)
  if (theme) shared.value = theme
  else toast.add({ severity: 'error', summary: 'This share link doesn\'t work', detail: 'It may be incomplete (cut off when it was sent) or damaged.', life: 6000 })
}

function add() {
  if (!shared.value) return
  const doc = workspace.importTheme(shared.value.name, shared.value.theme)
  shared.value = null
  // A shared theme is already designed: no first-run setup for it.
  if (editor.setupOpen) editor.closeSetup()
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
    header="Open a shared theme"
    modal
    :style="{ width: '26rem' }"
    @update:visible="v => !v && (shared = null)"
  >
    <div
      v-if="shared"
      class="flex flex-col gap-4"
    >
      <p class="text-sm">
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
          label="Add theme"
          icon="pi pi-plus"
          @click="add"
        />
      </div>
    </div>
  </Dialog>
</template>

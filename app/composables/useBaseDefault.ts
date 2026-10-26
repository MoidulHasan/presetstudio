import { useWorkspaceStore } from '~/stores/workspace'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'

/**
 * How the editor names "the base preset's own value": 'Aura default' (and 'Aura' where space is
 * short), the same wording everywhere a choice can fall back to it.
 */
export function useBaseDefault() {
  const workspace = useWorkspaceStore()
  const base = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])
  return { base, baseDefault: computed(() => `${base.value} default`) }
}

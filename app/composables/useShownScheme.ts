import { useEditorStore } from '~/stores/editor'

/**
 * The mode the preview shows (its Light | Dark | Both switch), for swatches in the panel: a color
 * shows in that mode, or as a light | dark pair with "Both". One switch decides everywhere.
 */
export function useShownScheme() {
  const editor = useEditorStore()
  return {
    both: computed(() => editor.prefs.split),
    scheme: computed(() => editor.prefs.colorScheme),
  }
}

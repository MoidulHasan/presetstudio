import { defineStore } from 'pinia'
import { generatePresetCode } from '~/utils/theme/export'
import { generatePalette, normalizeHex } from '~/utils/theme/palette'
import { deserializeThemeState, serializeThemeState } from '~/utils/theme/serialize'
import { createDefaultThemeState, type BasePresetName, type ColorScheme, type ThemeState } from '~/utils/theme/types'

const STORAGE_KEY = 'presetstudio:theme'

function loadState(): ThemeState | null {
  if (!import.meta.client) return null
  try {
    return deserializeThemeState(window.localStorage.getItem(STORAGE_KEY))
  }
  catch {
    // Storage can be unavailable (privacy mode, blocked cookies, quota).
    return null
  }
}

function saveState(state: ThemeState): void {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeThemeState(state))
  }
  catch {
    // Ignore: persistence is best-effort.
  }
}

export const useThemeStore = defineStore('theme', () => {
  const state = ref<ThemeState>(loadState() ?? createDefaultThemeState())

  const primaryPalette = computed(() => generatePalette(state.value.primaryColor))
  const exportCode = computed(() => generatePresetCode(state.value))

  function setBasePreset(name: BasePresetName) {
    state.value.basePreset = name
  }

  /** Ignores invalid colors so partially typed input never breaks the preview. */
  function setPrimaryColor(color: string) {
    const hex = normalizeHex(color)
    if (hex) state.value.primaryColor = hex
  }

  function setColorScheme(scheme: ColorScheme) {
    state.value.colorScheme = scheme
  }

  function reset() {
    state.value = createDefaultThemeState()
  }

  watch(state, value => saveState(value), { deep: true })

  return { state, primaryPalette, exportCode, setBasePreset, setPrimaryColor, setColorScheme, reset }
})

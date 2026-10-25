import type { Ref } from 'vue'
import { normalizeHex } from '~/utils/theme/palette'
import type { ColorPalette, Shade } from '~/utils/theme/types'

/**
 * Per-shade tweaks of a generated palette (custom primary or surface color): pick a shade, give
 * it its own color, reset it. `set` writes the design with its new shades; `key` is the undo
 * coalescing prefix for drags of one shade's color picker.
 */
export function useShadeTweaks<T extends { shades: Partial<ColorPalette> }>(options: {
  custom: Ref<T | null>
  palette: Ref<ColorPalette | null>
  set: (value: T, key?: string | null) => void
  key: () => string
  /** The selection is cleared when this value changes (another kind of color, another scheme). */
  resetOn: () => string
}) {
  const selectedShade = ref<Shade | null>(null)
  watch(options.resetOn, () => {
    selectedShade.value = null
  })

  const editedShades = computed(() => Object.keys(options.custom.value?.shades ?? {}) as Shade[])

  const shadeColor = computed({
    get: () => (selectedShade.value && options.palette.value ? options.palette.value[selectedShade.value].replace('#', '') : '000000'),
    set: (value: string) => {
      const c = options.custom.value
      const shade = selectedShade.value
      const hex = normalizeHex(value)
      if (!c || !shade || !hex) return
      options.set({ ...c, shades: { ...c.shades, [shade]: hex } }, `${options.key()}.${shade}`)
    },
  })

  function resetShade(shade: Shade) {
    const c = options.custom.value
    if (!c) return
    const shades = Object.fromEntries(Object.entries(c.shades).filter(([key]) => key !== shade))
    options.set({ ...c, shades })
  }

  return { selectedShade, editedShades, shadeColor, resetShade }
}

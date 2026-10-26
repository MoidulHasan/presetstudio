import { logoVars } from '~/utils/logo'
import type { ColorPalette } from '~/utils/theme/types'

/**
 * Colors the logo with a palette while the calling page is shown. The colors go on `<html>` as
 * CSS variables, not into component state: on the prerendered landing page the header renders
 * before the page has its colors, and the head is written last, so this still lands in the HTML.
 */
export function useLogoColors(palette: () => Partial<ColorPalette> | null | undefined) {
  useHead({
    htmlAttrs: {
      style: computed(() => {
        const vars = logoVars(palette())
        return vars ? Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';') : undefined
      }),
    },
  })
}

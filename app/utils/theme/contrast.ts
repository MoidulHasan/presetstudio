import { contrastRatio, parseColor } from './color'
import type { TokenResolver } from './tokens'

export interface ContrastPair {
  id: string
  label: string
  foreground: string
  background: string
  /** WCAG minimum: 4.5 for text, 3 for UI components and focus indicators. */
  minimum: 4.5 | 3
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: 'primary', label: 'Primary button text', foreground: 'primary-contrast-color', background: 'primary-color', minimum: 4.5 },
  { id: 'text', label: 'Body text', foreground: 'text-color', background: 'content-background', minimum: 4.5 },
  { id: 'muted', label: 'Muted text', foreground: 'text-muted-color', background: 'content-background', minimum: 4.5 },
  { id: 'field', label: 'Input text', foreground: 'form-field-color', background: 'form-field-background', minimum: 4.5 },
  { id: 'placeholder', label: 'Placeholder', foreground: 'form-field-placeholder-color', background: 'form-field-background', minimum: 4.5 },
  { id: 'highlight', label: 'Selected item', foreground: 'highlight-color', background: 'highlight-background', minimum: 4.5 },
  { id: 'primary-ui', label: 'Primary on surface', foreground: 'primary-color', background: 'content-background', minimum: 3 },
  { id: 'field-border', label: 'Input border', foreground: 'form-field-border-color', background: 'form-field-background', minimum: 3 },
]

export interface ContrastResult {
  pair: ContrastPair
  foreground: string | null
  background: string | null
  /** null when a value can't be evaluated statically (e.g. CSS functions we don't support). */
  ratio: number | null
  pass: boolean | null
}

export function checkContrast(resolver: TokenResolver, pairs: readonly ContrastPair[] = CONTRAST_PAIRS): ContrastResult[] {
  const backdropValue = resolver.resolve('content-background')?.value
  const backdrop = (backdropValue && parseColor(backdropValue)) || undefined
  return pairs.map((pair) => {
    const fgValue = resolver.resolve(pair.foreground)?.value ?? null
    const bgValue = resolver.resolve(pair.background)?.value ?? null
    const fg = fgValue ? parseColor(fgValue) : null
    const bg = bgValue ? parseColor(bgValue) : null
    if (!fg || !bg) return { pair, foreground: fgValue, background: bgValue, ratio: null, pass: null }
    const ratio = contrastRatio(fg, bg, backdrop)
    return { pair, foreground: fgValue, background: bgValue, ratio, pass: ratio >= pair.minimum }
  })
}

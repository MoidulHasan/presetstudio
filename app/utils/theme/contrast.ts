import { contrastRatio, parseColor } from './color'
import type { TokenResolver } from './tokens'

export interface ContrastPair {
  id: string
  label: string
  foreground: string
  background: string
  /** WCAG minimum: 4.5 for text, 3 for UI components and focus indicators. */
  minimum: 4.5 | 3
  /**
   * Advisory pairs are reported but never counted as failures. WCAG 1.4.11 only
   * requires a 3:1 input border when the border alone identifies the control.
   */
  advisory?: boolean
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: 'primary', label: 'Primary button text', foreground: 'primary-contrast-color', background: 'primary-color', minimum: 4.5 },
  { id: 'text', label: 'Body text', foreground: 'text-color', background: 'content-background', minimum: 4.5 },
  { id: 'muted', label: 'Muted text', foreground: 'text-muted-color', background: 'content-background', minimum: 4.5 },
  { id: 'field', label: 'Input text', foreground: 'form-field-color', background: 'form-field-background', minimum: 4.5 },
  { id: 'placeholder', label: 'Placeholder', foreground: 'form-field-placeholder-color', background: 'form-field-background', minimum: 4.5 },
  { id: 'highlight', label: 'Selected item', foreground: 'highlight-color', background: 'highlight-background', minimum: 4.5 },
  { id: 'primary-ui', label: 'Primary on surface', foreground: 'primary-color', background: 'content-background', minimum: 3 },
  { id: 'field-border', label: 'Input border', foreground: 'form-field-border-color', background: 'form-field-background', minimum: 3, advisory: true },
]

export interface ContrastResult {
  pair: ContrastPair
  foreground: string | null
  background: string | null
  /** null when a value can't be evaluated statically (e.g. CSS functions we don't support). */
  ratio: number | null
  pass: boolean | null
}

/** How much lower than the base preset's a ratio may be and still count as the preset's own. */
export const CONTRAST_TOLERANCE = 0.05

/** Contrast of two tokens (names) in a resolver, or null when either isn't a parseable color. */
export function tokenContrast(resolver: TokenResolver | null | undefined, foreground: string, background: string): number | null {
  const fg = parseColor(resolver?.resolve(foreground)?.value ?? '')
  const bg = parseColor(resolver?.resolve(background)?.value ?? '')
  return fg && bg ? contrastRatio(fg, bg) : null
}

/**
 * Below `minimum` and noticeably worse than the base preset: a problem this theme made (the
 * presets' own severities often miss 4.5:1, which isn't flagged).
 */
export function worseThanBase(ratio: number | null, baseRatio: number | null, minimum = 4.5): boolean {
  return ratio !== null && ratio < minimum && (baseRatio === null || ratio < baseRatio - CONTRAST_TOLERANCE)
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

export type ContrastStatus = 'pass' | 'introduced' | 'inherited' | 'advisory' | 'unknown'

export interface ClassifiedContrast extends ContrastResult {
  status: ContrastStatus
  /** Ratio in the untouched base preset, for comparison. */
  baselineRatio: number | null
}

/**
 * Separates problems the user introduced from ones the base preset already has.
 * A failure is "inherited" when the base preset fails the same pair and the theme
 * didn't make it noticeably worse.
 */
export function classifyContrast(current: ContrastResult[], baseline: ContrastResult[]): ClassifiedContrast[] {
  return current.map((result) => {
    const base = baseline.find(b => b.pair.id === result.pair.id)
    const baselineRatio = base?.ratio ?? null
    let status: ContrastStatus
    if (result.pass === null) status = 'unknown'
    else if (result.pass) status = 'pass'
    else if (result.pair.advisory) status = 'advisory'
    else if (base?.pass === false && baselineRatio !== null && result.ratio! >= baselineRatio - CONTRAST_TOLERANCE) status = 'inherited'
    else status = 'introduced'
    return { ...result, status, baselineRatio }
  })
}

// --- Fixing a failing pair ------------------------------------------------------------------

/**
 * Which side of a pair a fix moves, and tokens that move along by the same number of steps (the
 * primary color's hover and pressed shades keep their spacing). Pairs not listed have no fix.
 */
const FIXES: Record<string, { adjust: 'foreground' | 'background', with?: string[] }> = {
  'primary': { adjust: 'background', with: ['primary-hover-color', 'primary-active-color'] },
  'primary-ui': { adjust: 'foreground', with: ['primary-hover-color', 'primary-active-color'] },
  'text': { adjust: 'foreground' },
  'muted': { adjust: 'foreground' },
  'field': { adjust: 'foreground' },
  'placeholder': { adjust: 'foreground' },
  'highlight': { adjust: 'foreground' },
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export interface ContrastFix {
  /** Tokens to point at other shades of their scale, e.g. { token: 'primary-color', value: '{primary.700}' }. */
  edits: Array<{ token: string, value: string }>
  /** Where the adjusted token goes, e.g. 'primary.700'. */
  to: string
  /** The pair's ratio after the fix. */
  ratio: number
}

/** The scale shade a token points at ('primary-color' → primary 500), if it points at one. */
function shadeOf(resolver: TokenResolver, token: string): { group: string, step: number } | null {
  for (const name of resolver.resolve(token)?.chain.slice(1) ?? []) {
    const match = /^([a-z]+)-(\d{2,3})$/.exec(name)
    if (match && STEPS.includes(Number(match[2]))) return { group: match[1]!, step: STEPS.indexOf(Number(match[2])) }
  }
  return null
}

/**
 * The smallest change that makes a failing pair pass: the adjusted token moves to the nearest
 * shade of its own scale that reaches the pair's minimum (so the theme keeps its colors), and its
 * companions move by as many steps. Null when the pair passes, has no fix, or no shade passes.
 */
export function contrastFix(resolver: TokenResolver, pair: ContrastPair): ContrastFix | null {
  const plan = FIXES[pair.id]
  if (!plan) return null
  const adjusted = plan.adjust === 'foreground' ? pair.foreground : pair.background
  const fixed = plan.adjust === 'foreground' ? pair.background : pair.foreground
  const other = parseColor(resolver.resolve(fixed)?.value ?? '')
  const from = shadeOf(resolver, adjusted)
  if (!other || !from) return null
  const backdrop = parseColor(resolver.resolve('content-background')?.value ?? '') ?? undefined
  const ratioWith = (color: string) => {
    const c = parseColor(color)
    if (!c) return 0
    return plan.adjust === 'foreground' ? contrastRatio(c, other, backdrop) : contrastRatio(other, c, backdrop)
  }
  const current = ratioWith(resolver.resolve(adjusted)?.value ?? '')
  if (current >= pair.minimum) return null

  const candidates = STEPS
    .map((step, index) => ({ index, ratio: ratioWith(resolver.resolve(`${from.group}-${step}`)?.value ?? '') }))
    .filter(c => c.index !== from.step && c.ratio >= pair.minimum)
    .sort((a, b) => Math.abs(a.index - from.step) - Math.abs(b.index - from.step) || b.ratio - a.ratio)
  const best = candidates[0]
  if (!best) return null

  const delta = best.index - from.step
  const ref = (group: string, index: number) => `{${group}.${STEPS[Math.min(STEPS.length - 1, Math.max(0, index))]}}`
  const edits = [{ token: adjusted, value: ref(from.group, best.index) }]
  for (const token of plan.with ?? []) {
    const shade = shadeOf(resolver, token)
    if (shade && shade.group === from.group) edits.push({ token, value: ref(shade.group, shade.step + delta) })
  }
  return { edits, to: `${from.group}.${STEPS[best.index]}`, ratio: best.ratio }
}

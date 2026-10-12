import { isTokenTree } from './merge'
import { tokenName } from './tokens'
import type { ColorScheme, TokenTree } from './types'

export type TokenKind = 'color' | 'length' | 'spacing' | 'radius' | 'shadow' | 'duration' | 'number' | 'fontWeight' | 'string'

export type TokenLayer = 'primitive' | 'semantic' | 'component'

export interface TokenDescriptor {
  /** CSS variable name without prefix, e.g. 'button-primary-hover-background'. */
  name: string
  /** Path in the preset object, used to write overrides. */
  path: string[]
  layer: TokenLayer
  /** Component name for component tokens. */
  component?: string
  /** Color scheme the token belongs to; null when shared by both. */
  scheme: ColorScheme | null
  kind: TokenKind
  /** Human label from the last path segments, e.g. 'Primary › Hover background'. */
  label: string
  /** Raw value in the base preset. */
  defaultValue: string | number
}

const COLOR_VALUE_RE = /^(#|rgba?\(|hsla?\(|color-mix\(|transparent$|white$|black$|unset$|inherit$)/i
const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%)?$/
const MULTI_LENGTH_RE = /^(-?\d*\.?\d+(px|rem|em|%)?\s+){1,3}-?\d*\.?\d+(px|rem|em|%)?$/

export function inferTokenKind(key: string, value: string | number): TokenKind {
  const k = key.toLowerCase()
  const v = String(value).trim()
  if (/shadow/.test(k)) return 'shadow'
  if (/duration/.test(k)) return 'duration'
  if (/fontweight/.test(k)) return 'fontWeight'
  if (/opacity/.test(k)) return 'number'
  if (/radius/.test(k)) return 'radius'
  if (/(color|background)$/.test(k) || /^(color|background)/.test(k) || COLOR_VALUE_RE.test(v)) return 'color'
  if (/padding|margin|gap|gutter/.test(k) || MULTI_LENGTH_RE.test(v)) return 'spacing'
  if (/width|height|size|offset/.test(k) || LENGTH_RE.test(v)) return 'length'
  // Primitive ramps (emerald.500 etc.) and surface shades.
  if (/^\d+$/.test(k)) return 'color'
  return 'string'
}

function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelFor(path: string[]): string {
  const meaningful = path.filter(k => !['primitive', 'semantic', 'components', 'colorScheme', 'light', 'dark', 'root'].includes(k))
  return meaningful.map(humanize).join(' › ')
}

/** Lists every editable token of a preset with inferred kind and metadata. */
export function describePreset(preset: TokenTree): TokenDescriptor[] {
  const out: TokenDescriptor[] = []

  const walk = (node: TokenTree, path: string[], scheme: ColorScheme | null) => {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'css' || key === 'extend') continue
      if (key === 'colorScheme' && isTokenTree(value)) {
        for (const s of ['light', 'dark'] as const) {
          if (isTokenTree(value[s])) walk(value[s] as TokenTree, [...path, key, s], s)
        }
        continue
      }
      const p = [...path, key]
      if (isTokenTree(value)) {
        walk(value, p, scheme)
      }
      else if (typeof value === 'string' || typeof value === 'number') {
        const layer: TokenLayer = p[0] === 'primitive' ? 'primitive' : p[0] === 'semantic' ? 'semantic' : 'component'
        out.push({
          name: tokenName(p),
          path: p,
          layer,
          component: layer === 'component' ? p[1] : undefined,
          scheme,
          kind: inferTokenKind(key, value),
          label: labelFor(layer === 'component' ? p.slice(2) : p),
          defaultValue: value,
        })
      }
    }
  }

  for (const layer of ['primitive', 'semantic', 'components'] as const) {
    const tree = preset[layer]
    if (isTokenTree(tree)) walk(tree, [layer], null)
  }
  return out
}

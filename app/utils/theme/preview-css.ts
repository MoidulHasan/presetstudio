// CSS the preview derives from the theme's own stylesheets:
// - forced states: hover, pressed and focus styles only apply to the element being interacted
//   with, so copies of those rules are scoped to a class (`.ps-force-hover .p-button`) to show
//   every state at once (the focus-states toggle and the component stage);
// - scheme scopes: PrimeVue declares variables on `:root` and dark ones on the dark-mode class.
//   Variables that reference others (`--p-card-background: var(--p-content-background)`) are
//   resolved where declared, so a dark area inside a light page needs them re-declared there.
//
// Everything works on stylesheet source text, not the CSSOM: the CSSOM serializes shorthands
// that use var() as empty longhands.

export type ForcedState = 'focus' | 'hover' | 'active'

const STATE_RE: Record<ForcedState, RegExp> = {
  focus: /:focus(?:-visible)?(?![-\w])/,
  hover: /:hover(?![-\w])/,
  active: /:active(?![-\w])/,
}

/** Splits a selector list on top-level commas (not those inside :is(), :not(), …). */
export function splitSelectorList(selector: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      out.push(selector.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(selector.slice(start).trim())
  return out.filter(Boolean)
}

/**
 * Rewrites a selector list so its `state` styles apply without the interaction, inside `scope`.
 * Returns null when no selector in the list depends on the state.
 * `.p-button:not(:disabled):hover` → `.scope .p-button:not(:disabled)`.
 */
export function forcedStateSelector(selector: string, scope: string, state: ForcedState): string | null {
  const re = STATE_RE[state]
  const all = new RegExp(re.source, 'g')
  const negated = new RegExp(`:not\\([^)]*${re.source.slice(0, re.source.indexOf('('))}`)
  const rewritten = splitSelectorList(selector)
    // Negated states (`:not(:focus)`) can't be forced meaningfully.
    .filter(s => re.test(s) && !negated.test(s))
    .map((s) => {
      // A bare `:focus-visible` (no compound before it) means "any element".
      const forced = s.replace(all, (_, offset: number) => (offset === 0 || /[\s>+~(]/.test(s[offset - 1]!) ? '*' : ''))
      return `${scope} ${forced.trim()}`
    })
  return rewritten.length ? rewritten.join(', ') : null
}

export function forcedFocusSelector(selector: string, scope: string): string | null {
  return forcedStateSelector(selector, scope, 'focus')
}

interface CssRule {
  /** Selector, or the at-rule prelude ('@media (…)'). */
  prelude: string
  body: string
}

/** Top-level rules of a stylesheet (statements like `@layer a, b;` are skipped). */
function topLevelRules(css: string): CssRule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: CssRule[] = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open < 0) break
    const raw = text.slice(i, open)
    const prelude = raw.slice(raw.lastIndexOf(';') + 1).trim()
    let depth = 1
    let close = open + 1
    for (; close < text.length && depth > 0; close++) {
      if (text[close] === '{') depth++
      else if (text[close] === '}') depth--
    }
    out.push({ prelude, body: text.slice(open + 1, close - 1) })
    i = close
  }
  return out
}

const GROUP_RULE_RE = /^@(media|layer|supports|container)\b/

/** CSS that applies `state` styles inside `scope`, built from stylesheet source text. */
export function forcedStateCss(css: string, scope: string, state: ForcedState): string {
  const out: string[] = []
  for (const { prelude, body } of topLevelRules(css)) {
    if (prelude.startsWith('@')) {
      if (GROUP_RULE_RE.test(prelude)) {
        const inner = forcedStateCss(body, scope, state)
        if (inner) out.push(`${prelude} { ${inner} }`)
      }
      continue
    }
    const forced = prelude && forcedStateSelector(prelude, scope, state)
    if (forced) out.push(`${forced} { ${body.trim()} }`)
  }
  return out.join('\n')
}

export function forcedFocusCss(css: string, scope: string): string {
  return forcedStateCss(css, scope, 'focus')
}

const ROOT_SELECTOR_RE = /^:root(\s*,\s*:host)?$/

/**
 * Re-declares the theme's variables inside `scope` (light values) and `scope.dark`
 * (dark values), so light and dark areas can sit side by side on one page.
 */
export function schemeScopeCss(cssTexts: string[], scope: string, darkClass: string): string {
  const light: string[] = []
  const dark: string[] = []
  const collect = (css: string) => {
    for (const { prelude, body } of topLevelRules(css)) {
      if (GROUP_RULE_RE.test(prelude)) collect(body)
      else if (ROOT_SELECTOR_RE.test(prelude)) light.push(body.trim())
      else if (prelude === `.${darkClass}`) dark.push(body.trim())
    }
  }
  cssTexts.forEach(collect)
  if (!light.length && !dark.length) return ''
  return `${scope} { ${light.join(' ')} }\n${scope}.${darkClass} { ${dark.join(' ')} }`
}

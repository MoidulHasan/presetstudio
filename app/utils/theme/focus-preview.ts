// "Show focus states" in the preview: focus styles only apply to the focused element, so
// copies of the components' :focus / :focus-visible rules are scoped to a class instead.

const FOCUS_RE = /:focus(?:-visible)?(?![-\w])/
const FOCUS_ALL_RE = new RegExp(FOCUS_RE.source, 'g')

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
 * Rewrites a selector list so its focus styles apply without focus, inside `scope`.
 * Returns null when no selector in the list depends on focus.
 * `.p-button:focus-visible` → `.scope .p-button`.
 */
export function forcedFocusSelector(selector: string, scope: string): string | null {
  const rewritten = splitSelectorList(selector)
    // Negated focus (`:not(:focus)`) can't be forced meaningfully.
    .filter(s => FOCUS_RE.test(s) && !/:not\([^)]*:focus/.test(s))
    .map((s) => {
      // A bare `:focus-visible` (no compound before it) means "any element".
      const forced = s.replace(FOCUS_ALL_RE, (_, offset: number) => (offset === 0 || /[\s>+~(]/.test(s[offset - 1]!) ? '*' : ''))
      return `${scope} ${forced.trim()}`
    })
  return rewritten.length ? rewritten.join(', ') : null
}

/**
 * Builds the CSS that forces focus styles inside `scope` from stylesheet source text.
 * Works on the source (not CSSOM) because the CSSOM serializes shorthands that use var()
 * as empty longhands. Recurses into conditional group rules (@media, @layer, @supports…).
 */
export function forcedFocusCss(css: string, scope: string): string {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: string[] = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open < 0) break
    // Statements like `@import …;` or `@layer a, b;` can precede the rule.
    const raw = text.slice(i, open)
    const prelude = raw.slice(raw.lastIndexOf(';') + 1).trim()
    // Find the matching close brace.
    let depth = 1
    let close = open + 1
    for (; close < text.length && depth > 0; close++) {
      if (text[close] === '{') depth++
      else if (text[close] === '}') depth--
    }
    const body = text.slice(open + 1, close - 1)
    if (prelude.startsWith('@')) {
      if (/^@(media|layer|supports|container)\b/.test(prelude)) {
        const inner = forcedFocusCss(body, scope)
        if (inner) out.push(`${prelude} { ${inner} }`)
      }
    }
    else {
      const forced = prelude && forcedFocusSelector(prelude, scope)
      if (forced) out.push(`${forced} { ${body.trim()} }`)
    }
    i = close
  }
  return out.join('\n')
}

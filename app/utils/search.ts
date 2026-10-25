// Ranking for the editor's search (⌘K): sections, components, tokens and actions, matched by
// every word of the query. Framework-free; the editor builds the entries.

export type SearchKind = 'section' | 'component' | 'token' | 'action'

export interface SearchEntry {
  id: string
  kind: SearchKind
  label: string
  /** Shown under the label; also searched (lower weight). */
  detail?: string
  /** Searched, not shown (CSS variable names, synonyms). */
  keywords?: string
  icon?: string
}

export interface SearchGroup<T extends SearchEntry = SearchEntry> {
  kind: SearchKind
  label: string
  items: T[]
}

export const SEARCH_GROUP_LABELS: Record<SearchKind, string> = {
  section: 'Sections',
  component: 'Components',
  token: 'Tokens',
  action: 'Actions',
}

const ORDER: SearchKind[] = ['section', 'component', 'token', 'action']

/** Most results shown per kind. */
const LIMITS: Record<SearchKind, number> = { section: 6, component: 8, token: 12, action: 5 }

/** Lowercase words: 'formField.focusBorderColor' and 'form-field-focus' → 'form field focus …'. */
export function words(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim()
}

// Shorthand people type for words in token names.
const ALIASES: Record<string, string> = { bg: 'background', btn: 'button', txt: 'text' }

/** Query terms, normalized like the text they're matched against (shorthand spelled out). */
export function terms(query: string): string[] {
  return words(query).split(' ').filter(Boolean).map(term => ALIASES[term] ?? term)
}

/** 0 when a term doesn't match anywhere; higher for label matches, word starts and whole labels. */
export function scoreEntry(entry: SearchEntry, queryTerms: string[]): number {
  if (!queryTerms.length) return 1
  const label = words(entry.label)
  const labelWords = label.split(' ')
  const rest = words(`${entry.detail ?? ''} ${entry.keywords ?? ''}`)
  let score = 0
  for (const term of queryTerms) {
    if (labelWords.includes(term)) score += 30
    else if (labelWords.some(w => w.startsWith(term))) score += 20
    else if (label.includes(term)) score += 10
    else if (rest.split(' ').some(w => w.startsWith(term))) score += 4
    else if (rest.includes(term)) score += 2
    else return 0
  }
  const phrase = queryTerms.join(' ')
  if (label === phrase) score += 100
  else if (label.startsWith(phrase)) score += 40
  return score
}

/**
 * Matching entries grouped by kind, best first within each and capped per kind. The group with
 * the best match comes first (so Enter opens it); ties keep sections, components, tokens,
 * actions. Tokens only show from two characters on (there are thousands).
 */
export function searchEntries<T extends SearchEntry>(entries: readonly T[], query: string): Array<SearchGroup<T>> {
  const queryTerms = terms(query)
  const typed = queryTerms.join('').length
  const scored = entries
    .map((entry, index) => ({ entry, index, score: entry.kind === 'token' && typed < 2 ? 0 : scoreEntry(entry, queryTerms) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.length - b.entry.label.length || a.index - b.index)
  return ORDER
    .map((kind) => {
      const matches = scored.filter(s => s.entry.kind === kind).slice(0, LIMITS[kind])
      return { kind, label: SEARCH_GROUP_LABELS[kind], items: matches.map(s => s.entry), best: matches[0]?.score ?? 0 }
    })
    .filter(group => group.items.length)
    .sort((a, b) => b.best - a.best)
    .map(({ best: _best, ...group }) => group)
}

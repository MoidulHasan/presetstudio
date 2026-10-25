import { describe, expect, it } from 'vitest'
import { scoreEntry, searchEntries, terms, words, type SearchEntry } from './search'

const entries: SearchEntry[] = [
  { id: 'section:primary', kind: 'section', label: 'Primary color' },
  { id: 'section:formfield', kind: 'section', label: 'Form fields', keywords: 'inputs' },
  { id: 'component:button', kind: 'component', label: 'Button' },
  { id: 'component:splitbutton', kind: 'component', label: 'SplitButton' },
  { id: 'component:inputtext', kind: 'component', label: 'InputText' },
  { id: 'token:button-primary-hover-background', kind: 'token', label: 'Button › Primary › Hover background', keywords: 'button-primary-hover-background' },
  { id: 'token:form-field-focus-border-color', kind: 'token', label: 'Form field › Focus border color', keywords: 'form-field-focus-border-color' },
  { id: 'action:export', kind: 'action', label: 'Export code', keywords: 'download' },
]

const ids = (query: string) => searchEntries(entries, query).flatMap(g => g.items.map(i => i.id))

describe('words and terms', () => {
  it('splits camelCase, dashes and dots', () => {
    expect(words('formField.focusBorderColor')).toBe('form field focus border color')
    expect(words('--p-form-field-focus')).toBe('p form field focus')
    expect(terms('  Hover   BG ')).toEqual(['hover', 'background'])
  })
})

describe('scoreEntry', () => {
  it('needs every term to match somewhere', () => {
    expect(scoreEntry(entries[5]!, ['button', 'hover'])).toBeGreaterThan(0)
    expect(scoreEntry(entries[5]!, ['button', 'focus'])).toBe(0)
  })

  it('ranks a whole-label match over a word start and a word start over a keyword', () => {
    const button = scoreEntry(entries[2]!, ['button'])
    const token = scoreEntry(entries[5]!, ['button'])
    const keyword = scoreEntry(entries[1]!, ['inputs'])
    expect(button).toBeGreaterThan(token)
    expect(token).toBeGreaterThan(keyword)
    expect(keyword).toBeGreaterThan(0)
  })
})

describe('searchEntries', () => {
  it('groups results by kind, the group with the best match first', () => {
    expect(searchEntries(entries, 'f').map(g => g.kind)).toEqual(['section'])
    // Equally good: the fixed order (sections, components, tokens, actions).
    expect(searchEntries(entries, 'form').map(g => g.kind)).toEqual(['section', 'token'])
    // A component named exactly that beats a section that only mentions it.
    expect(searchEntries([...entries, { id: 'section:status', kind: 'section', label: 'Status colors', keywords: 'buttons, toasts' }], 'button')[0]!.kind).toBe('component')
  })

  it('puts the best match first within a kind', () => {
    expect(ids('button')).toEqual(['component:button', 'component:splitbutton', 'token:button-primary-hover-background'])
  })

  it('finds tokens by their CSS variable name', () => {
    expect(ids('form-field-focus')).toContain('token:form-field-focus-border-color')
  })

  it('leaves tokens out until two characters are typed', () => {
    expect(ids('')).not.toContain('token:button-primary-hover-background')
    expect(ids('')).toContain('action:export')
  })

  it('finds actions by keyword', () => {
    expect(ids('download')).toEqual(['action:export'])
  })
})

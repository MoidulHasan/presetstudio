import { describe, expect, it } from 'vitest'
import { createApplyMessage, createInspectMessage, createReadyMessage, createRevealedMessage, createRevealMessage, createScrollMessage, createScrollToMessage, createShortcutMessage, createStagePickMessage, parseEditorMessage, parsePreviewMessage } from './messages'
import { generateClassicPalette, normalizeHex } from './palette'
import {
  createWorkspace,
  deserializeThemeState,
  deserializeWorkspace,
  MAX_TOMBSTONES,
  mergeWorkspaces,
  parseThemeState,
  parseWorkspace,
  sanitizeThemeName,
  serializeThemeState,
} from './serialize'
import { createDefaultDesign, createDefaultThemeState, type ThemeDocument, type ThemeState, type Workspace } from './types'

const custom: ThemeState = {
  ...createDefaultThemeState('nora'),
  design: {
    ...createDefaultDesign(),
    primary: { kind: 'custom', color: '#6366f1', algorithm: 'oklch', shades: { 50: '#ffffff' } },
    surface: { light: { kind: 'palette', name: 'stone' }, dark: { kind: 'custom', color: '#1e293b', shades: { 950: '#000000' } } },
    status: { ...createDefaultDesign().status, info: { kind: 'palette', name: 'violet' }, danger: { kind: 'custom', color: '#be123c' } },
    tintedBackgrounds: true,
    radius: 'custom',
    customRadius: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
    density: 'custom',
    densityScale: 0.9,
    focusRing: { kind: 'outline', width: 2, offset: 2, color: 'primary' },
  },
  overrides: { semantic: { a: '1' } },
}

describe('theme state serialization', () => {
  it('round-trips a v2 ThemeState', () => {
    expect(deserializeThemeState(serializeThemeState(custom))).toEqual(custom)
  })

  it('migrates v1 states, preserving the exact v1 palette', () => {
    const migrated = parseThemeState({ version: 1, basePreset: 'lara', primaryColor: '#6366F1', overrides: { x: '1' }, colorScheme: 'dark' })!
    expect(migrated.version).toBe(2)
    expect(migrated.basePreset).toBe('lara')
    expect(migrated.design.primary).toEqual({ kind: 'custom', color: '#6366f1', algorithm: 'classic', shades: {} })
    expect(migrated.overrides).toEqual({ x: '1' })
  })

  it('rejects garbage and unknown versions', () => {
    expect(deserializeThemeState('not json')).toBeNull()
    expect(deserializeThemeState(null)).toBeNull()
    expect(parseThemeState({ version: 99 })).toBeNull()
    expect(parseThemeState([])).toBeNull()
  })

  it('falls back to defaults for invalid fields', () => {
    const parsed = parseThemeState({
      version: 2,
      basePreset: 'evil',
      design: {
        primary: { kind: 'custom', color: 'red' },
        surface: { light: { kind: 'palette', name: 'emerald' }, dark: { kind: 'tinted', chroma: 9 } },
        radius: 'huge',
        density: 1,
        focusRing: { kind: 'outline', width: 999, offset: 'x', color: 'javascript:alert(1)' },
      },
      overrides: 'x',
    })!
    expect(parsed.basePreset).toBe('aura')
    expect(parsed.design.primary).toEqual({ kind: 'base' })
    expect(parsed.design.surface.light).toEqual({ kind: 'base' })
    expect(parsed.design.surface.dark).toEqual({ kind: 'tinted', chroma: 0.04 })
    expect(parsed.design.radius).toBe('base')
    expect(parsed.design.density).toBe('base')
    expect(parsed.design.focusRing).toEqual({ kind: 'outline', width: 8, offset: 2, color: 'primary' })
    expect(parsed.overrides).toEqual({})
  })
})

describe('workspace serialization', () => {
  it('round-trips a workspace', () => {
    const ws = createWorkspace(custom)
    expect(deserializeWorkspace(JSON.stringify(ws))).toEqual(ws)
  })

  it('drops invalid and duplicate themes and repairs activeId', () => {
    const ws = createWorkspace(custom)
    const doc = ws.themes[0]!
    const parsed = parseWorkspace({ ...ws, activeId: 'missing', themes: [doc, doc, { id: 'x', theme: { version: 99 } }, 'junk'] })!
    expect(parsed.themes).toHaveLength(1)
    expect(parsed.activeId).toBe(doc.id)
    expect(parseWorkspace({ version: 2, activeId: 'a', themes: [] })).toBeNull()
  })

  it('reads tombstones from saved workspaces (older ones have none)', () => {
    const ws = createWorkspace(custom)
    const { deleted: _, ...old } = ws
    expect(parseWorkspace(old)!.deleted).toEqual({})
    const parsed = parseWorkspace({ ...ws, deleted: { a: 5, b: 'x', c: -1, d: Number.POSITIVE_INFINITY, ['e'.repeat(65)]: 1 } })!
    expect(parsed.deleted).toEqual({ a: 5 })
    const many = Object.fromEntries(Array.from({ length: MAX_TOMBSTONES + 10 }, (_, i) => [`t${i}`, i]))
    const kept = parseWorkspace({ ...ws, deleted: many })!.deleted
    expect(Object.keys(kept)).toHaveLength(MAX_TOMBSTONES)
    expect(kept.t0).toBeUndefined()
  })

  it('sanitizes theme names', () => {
    expect(sanitizeThemeName('  Brand\u0000 theme  ')).toBe('Brand theme')
    expect(sanitizeThemeName('')).toBe('Untitled theme')
    expect(sanitizeThemeName('x'.repeat(200))).toHaveLength(60)
  })
})

describe('palette helpers', () => {
  it('normalizes hex colors', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex('#10B981')).toBe('#10b981')
    expect(normalizeHex('red')).toBeNull()
  })

  it('generates 11 classic shades with the input at 500', () => {
    const p = generateClassicPalette('#10b981')
    expect(Object.keys(p)).toHaveLength(11)
    expect(p['500']).toBe('#10b981')
  })
})

describe('merging workspaces from two tabs', () => {
  const doc = (id: string, updatedAt: number, name = id): ThemeDocument =>
    ({ id, name, createdAt: 0, updatedAt, theme: createDefaultThemeState() })
  const ws = (themes: ThemeDocument[], deleted: Record<string, number> = {}, activeId = themes[0]!.id): Workspace =>
    ({ version: 2, activeId, themes, deleted })

  it('keeps the most recently updated copy of each theme', () => {
    const merged = mergeWorkspaces(ws([doc('a', 10, 'mine'), doc('b', 30, 'mine')]), ws([doc('a', 20, 'theirs'), doc('b', 20, 'theirs')]))
    expect(merged.themes.map(d => d.name)).toEqual(['theirs', 'mine'])
  })

  it('adds themes created in the other tab, after this tab\'s own', () => {
    const merged = mergeWorkspaces(ws([doc('a', 1)]), ws([doc('c', 1), doc('a', 1)]))
    expect(merged.themes.map(d => d.id)).toEqual(['a', 'c'])
  })

  it('keeps deleted themes deleted, unless edited after the delete', () => {
    const local = ws([doc('a', 1), doc('b', 5), doc('c', 50)])
    const remote = ws([doc('a', 1)], { b: 10, c: 10 })
    const merged = mergeWorkspaces(local, remote)
    expect(merged.themes.map(d => d.id)).toEqual(['a', 'c'])
    expect(merged.deleted).toEqual({ b: 10, c: 10 })
    // The other direction: the tab that deleted doesn't get it back.
    expect(mergeWorkspaces(remote, local).themes.map(d => d.id)).toEqual(['a', 'c'])
  })

  it('keeps this tab\'s active theme, or falls back to the first one', () => {
    expect(mergeWorkspaces(ws([doc('a', 1), doc('b', 1)], {}, 'b'), ws([doc('a', 1), doc('b', 1)], {}, 'a')).activeId).toBe('b')
    expect(mergeWorkspaces(ws([doc('a', 1), doc('b', 1)], {}, 'b'), ws([doc('a', 1)], { b: 2 })).activeId).toBe('a')
  })

  it('never ends up with no themes', () => {
    const merged = mergeWorkspaces(ws([doc('a', 1)], { b: 3 }), ws([doc('b', 2)], { a: 4 }))
    expect(merged.themes.map(d => d.id)).toEqual(['b'])
    expect(merged.deleted).toEqual({ a: 4 })
  })

  it('is stable: merging the result again changes nothing', () => {
    const local = ws([doc('a', 10), doc('b', 30)], { x: 1 })
    const remote = ws([doc('a', 20), doc('c', 5)], { y: 2 })
    const merged = mergeWorkspaces(local, remote)
    expect(mergeWorkspaces(merged, remote)).toEqual(merged)
  })
})

describe('messages', () => {
  const origin = 'https://presetstudio.example'

  it('accepts same-origin, well-formed messages', () => {
    const msg = createApplyMessage(custom, 'dark', { template: 'components', category: 'data', hideScrollbar: true })
    expect(parseEditorMessage({ origin, data: msg }, origin)).toEqual(msg)
    expect(parsePreviewMessage({ origin, data: createReadyMessage() }, origin)).toEqual(createReadyMessage())
  })

  it('rejects cross-origin, opaque-origin and foreign messages', () => {
    const msg = createApplyMessage(custom, 'light')
    expect(parseEditorMessage({ origin: 'https://evil.example', data: msg }, origin)).toBeNull()
    expect(parseEditorMessage({ origin: 'null', data: msg }, 'null')).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, channel: 'other' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, state: { version: 99 } } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, colorScheme: 'sepia' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, template: '../admin' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, category: 'nope' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, hideScrollbar: 'yes' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, bothSchemes: 1 } }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: msg }, origin)).toBeNull()
  })

  it('strips override keys that could inject CSS from applied states', () => {
    const msg = createApplyMessage({ ...createDefaultThemeState(), overrides: { semantic: { 'x;}body{background:red': '#fff', 'list': { gap: '4px' } }, components: { button: { css: 'x' } } } }, 'light')
    expect((parseEditorMessage({ origin, data: msg }, origin) as { state: { overrides: object } }).state.overrides).toEqual({ semantic: { list: { gap: '4px' } } })
  })
})

describe('override sanitization', () => {
  it('drops unsafe override values from untrusted state', () => {
    const parsed = parseThemeState({ ...createDefaultThemeState(), overrides: { semantic: { text: { color: 'red;} body{display:none' }, list: { gap: '4px' } } } })!
    expect(parsed.overrides).toEqual({ semantic: { list: { gap: '4px' } } })
  })
})

describe('component inspect messages', () => {
  const origin = 'https://presetstudio.app'
  it('round-trips reveal, inspect and revealed messages for known components only', () => {
    expect(parseEditorMessage({ origin, data: createRevealMessage('datatable') }, origin)).toEqual(createRevealMessage('datatable'))
    expect(parsePreviewMessage({ origin, data: createInspectMessage('button') }, origin)).toEqual(createInspectMessage('button'))
    expect(parsePreviewMessage({ origin, data: createRevealedMessage('tooltip', false) }, origin)).toEqual(createRevealedMessage('tooltip', false))
    // Unknown nested names are dropped.
    expect(parsePreviewMessage({ origin, data: createRevealedMessage('speeddial', true, ['button', '<script>']) }, origin)).toEqual(createRevealedMessage('speeddial', true, ['button']))
    expect(parseEditorMessage({ origin, data: createRevealMessage('__proto__') }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: { ...createInspectMessage('button'), component: 'x"><img>' } }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: { ...createRevealedMessage('button', true), found: 'yes' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...createApplyMessage(createDefaultThemeState(), 'light'), inspect: 1 } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: createApplyMessage(createDefaultThemeState(), 'light', { stage: 'button' }) }, origin)).toMatchObject({ stage: 'button' })
    expect(parseEditorMessage({ origin, data: createApplyMessage(createDefaultThemeState(), 'light', { stage: 'nope' }) }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: createStagePickMessage('root:danger:hover') }, origin)).toEqual(createStagePickMessage('root:danger:hover'))
    expect(parsePreviewMessage({ origin, data: createStagePickMessage('root:<b>') }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: createShortcutMessage('search') }, origin)).toEqual(createShortcutMessage('search'))
    expect(parsePreviewMessage({ origin, data: { ...createShortcutMessage('undo'), shortcut: 'delete-all' } }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin: 'https://evil.example', data: createShortcutMessage('undo') }, origin)).toBeNull()
  })
})

describe('scroll sync messages', () => {
  const origin = 'https://presetstudio.example'

  it('round-trips scroll and scroll-to messages', () => {
    const scroll = createScrollMessage({ x: 0, y: 420 })
    expect(parsePreviewMessage({ origin, data: scroll }, origin)).toEqual(scroll)
    const scrollTo = createScrollToMessage({ x: 10, y: 420 })
    expect(parseEditorMessage({ origin, data: scrollTo }, origin)).toEqual(scrollTo)
  })

  it('clamps and validates positions', () => {
    expect(parsePreviewMessage({ origin, data: { ...createScrollMessage({ x: 0, y: 0 }), y: -5 } }, origin)).toMatchObject({ y: 0 })
    expect(parsePreviewMessage({ origin, data: { ...createScrollMessage({ x: 0, y: 0 }), y: 'x' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...createScrollToMessage({ x: 0, y: 0 }), y: Number.NaN } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin: 'https://evil.example', data: createScrollToMessage({ x: 0, y: 1 }) }, origin)).toBeNull()
  })
})

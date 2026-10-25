import { describe, expect, it } from 'vitest'
import { listChanges, revertChange } from './changes'
import { createDefaultDesign, createDefaultThemeState, type ThemeState } from './types'

const edited: ThemeState = {
  ...createDefaultThemeState('aura'),
  design: {
    ...createDefaultDesign(),
    primary: { kind: 'custom', color: '#e11d48', algorithm: 'oklch', shades: { 700: '#7f1d1d' } },
    surface: { light: { kind: 'palette', name: 'stone' }, dark: { kind: 'base' } },
    tintedBackgrounds: true,
    status: { ...createDefaultDesign().status, info: { kind: 'palette', name: 'violet' } },
    radius: 'large',
    density: 'custom',
    densityScale: 0.9,
    focusRing: { kind: 'outline', width: 2, offset: 1, color: 'primary' },
  },
  overrides: {
    semantic: {
      formField: { paddingX: '1rem' },
      colorScheme: { dark: { formField: { background: '#000' }, highlight: { color: '#fff' } } },
      mask: { background: 'rgba(0,0,0,.6)' },
      transitionDuration: '0.1s',
    },
    components: {
      button: { root: { borderRadius: '9px' } },
      splitbutton: { root: { borderRadius: '{button.border.radius}' } },
    },
    primitive: { ps: { button: { info: { 500: '#123456' } } }, emerald: { 500: '#00ff00' } },
  },
}

describe('listChanges', () => {
  it('describes every change, design decisions first', () => {
    const changes = listChanges(edited)
    expect(changes.map(c => [c.id, c.label, c.detail])).toEqual([
      ['design:primary', 'Primary color', 'Custom #e11d48 · 1 shade adjusted'],
      ['design:surface', 'Surfaces', 'Light: Stone · Tinted backgrounds'],
      ['design:status:info', 'Info color', 'Violet'],
      ['design:radius', 'Corners', 'Large'],
      ['design:density', 'Density', 'Custom ×0.9'],
      ['design:focus', 'Focus ring', 'Outline 2px, offset 1px, primary color'],
      ['semantic:highlight', 'Highlight', '1 token changed'],
      ['semantic:formField', 'Form field', '2 tokens changed'],
      ['semantic:overlay', 'Overlay', '1 token changed'],
      ['semantic:general', 'General tokens', '1 token changed'],
      ['component:button', 'Button', '1 token changed'],
      ['component:splitbutton', 'SplitButton', '1 token changed'],
      ['other', 'Other tokens', '1 token changed'],
    ])
  })

  it('says where each change is edited', () => {
    const target = Object.fromEntries(listChanges(edited).map(c => [c.id, c.target]))
    expect(target['design:status:info']).toEqual({ section: 'status' })
    expect(target['semantic:formField']).toEqual({ section: 'formfield' })
    expect(target['semantic:overlay']).toEqual({ section: 'overlay' })
    expect(target['semantic:highlight']).toEqual({ section: 'selection' })
    expect(target['semantic:general']).toEqual({ section: 'semantic' })
    expect(target['component:button']).toEqual({ component: 'button' })
    expect(target.other).toBeNull()
    const area = Object.fromEntries(listChanges(edited).map(c => [c.id, c.area]))
    expect(area['semantic:formField']).toBe('shared')
    expect(area['semantic:general']).toBe('tokens')
  })

  it('lists nothing for an untouched theme', () => {
    expect(listChanges(createDefaultThemeState())).toEqual([])
  })
})

describe('revertChange', () => {
  it('reverts one change and keeps the others', () => {
    for (const change of listChanges(edited)) {
      const reverted = revertChange(edited, change.id)
      const ids = listChanges(reverted).map(c => c.id)
      expect(ids, change.id).not.toContain(change.id)
      expect(ids.length, change.id).toBeLessThan(listChanges(edited).length)
    }
  })

  it('reverts a component with its custom palettes and the links that followed it', () => {
    const reverted = revertChange(edited, 'component:button')
    expect(reverted.overrides.components).toBeUndefined()
    expect(reverted.overrides.primitive).toEqual({ emerald: { 500: '#00ff00' } })
  })

  it('reverts one status color only', () => {
    const both: ThemeState = { ...edited, design: { ...edited.design, status: { ...edited.design.status, danger: { kind: 'custom', color: '#991b1b' } } } }
    const reverted = revertChange(both, 'design:status:info')
    expect(reverted.design.status.info).toEqual({ kind: 'base' })
    expect(reverted.design.status.danger).toEqual({ kind: 'custom', color: '#991b1b' })
  })

  it('reverting everything gives back an untouched theme', () => {
    let state = edited
    for (const change of listChanges(edited)) state = revertChange(state, change.id)
    expect(listChanges(state)).toEqual([])
  })
})

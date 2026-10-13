import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { describePreset } from './schema'
import { PATTERN_SECTIONS, SEMANTIC_ELSEWHERE, SEMANTIC_STUDIO, countSemanticGroup, semanticCell, semanticStageName, semanticTokens, semanticUsedBy, withoutSemanticGroup } from './semantic-studio'
import { GROUPS_ORDER } from './semantic'
import { controlPath, type StudioSize } from './studio-controls'
import type { TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>

describe('semantic studio', () => {
  it('gives every semantic group one home: a visual editor or a documented other place', () => {
    for (const key of GROUPS_ORDER) {
      const visual = SEMANTIC_STUDIO.some(g => g.key === key)
      expect(visual || (SEMANTIC_ELSEWHERE as readonly string[]).includes(key), key).toBe(true)
      expect(visual && (SEMANTIC_ELSEWHERE as readonly string[]).includes(key), key).toBe(false)
    }
    // Every visual group but Primary (its grid is in the Primary color section) has its own section.
    const sectioned = Object.values(PATTERN_SECTIONS) as string[]
    expect(SEMANTIC_STUDIO.filter(g => g.key !== 'primary').every(g => sectioned.includes(g.key))).toBe(true)
  })

  it('points grid cells at light and dark tokens in every preset', () => {
    for (const [name, preset] of Object.entries(presets)) {
      const descriptors = describePreset(preset)
      for (const group of SEMANTIC_STUDIO) {
        for (const row of group.rows ?? []) {
          expect(row.key, row.key).toMatch(/^[a-z]+$/)
          for (const [column, path] of Object.entries(row.cells)) {
            expect(group.columns!.map(c => c.key), `${group.key}.${row.key}`).toContain(column)
            const cell = semanticCell(descriptors, path)
            expect(cell.light && cell.dark, `${name} ${path}`).toBeTruthy()
          }
        }
      }
    }
  })

  it('points controls at tokens in every preset', () => {
    for (const [name, preset] of Object.entries(presets)) {
      const descriptors = describePreset(preset)
      for (const group of SEMANTIC_STUDIO) {
        for (const section of group.sections ?? []) {
          for (const control of section.controls) {
            for (const size of (section.sizes ?? ['normal']) as StudioSize[]) {
              const path = controlPath(control, size)
              if (!path) continue
              const tokens = semanticTokens(descriptors, path)
              expect(tokens.length, `${name} ${path}`).toBe(control.schemes ? 2 : 1)
            }
          }
        }
      }
    }
  })

  it('finds the components that use a group', () => {
    const descriptors = describePreset(presets.aura!)
    const formField = semanticUsedBy(descriptors, 'formField')
    expect(formField).toEqual(expect.arrayContaining(['inputtext', 'select', 'datepicker', 'textarea']))
    expect(formField).not.toContain('card')
    expect(semanticUsedBy(descriptors, 'navigation')).toEqual(expect.arrayContaining(['menu', 'menubar', 'tieredmenu']))
    expect(semanticUsedBy(descriptors, 'general')).toContain('accordion')
  })

  it('counts and removes a group\'s custom values', () => {
    const overrides: TokenTree = {
      semantic: {
        formField: { paddingX: '1rem' },
        colorScheme: { light: { formField: { borderColor: 'red' }, list: { gap: '1px' } }, dark: { formField: { color: 'blue' } } },
        disabledOpacity: '0.5',
      },
    }
    expect(countSemanticGroup(overrides, 'formField')).toBe(3)
    expect(countSemanticGroup(overrides, 'general')).toBe(1)
    expect(countSemanticGroup({ semantic: { colorScheme: { dark: { mask: { background: 'black' } } } } }, 'overlay')).toBe(1)
    expect(withoutSemanticGroup(overrides, 'formField')).toEqual({ semantic: { colorScheme: { light: { list: { gap: '1px' } } }, disabledOpacity: '0.5' } })
    expect(semanticStageName('formField')).toBe('semantic-formfield')
  })
})

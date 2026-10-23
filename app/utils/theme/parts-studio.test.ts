import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { STUDIO_COMPONENTS, componentPath } from './components'
import { PARTS_STUDIO, componentCell, componentTokens, partsStudio } from './parts-studio'
import { describePreset } from './schema'
import { PATTERN_SECTIONS } from './semantic-studio'
import { controlPath, type StudioSize } from './studio-controls'
import type { TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>
const STAGE_TARGET_RE = /^[a-z]+(?::[a-z]+){0,3}$/

// Color tokens a parts studio leaves to the token list (and why).
const ELSEWHERE: Record<string, string[]> = {
  // Filter menus follow the Overlays and Lists patterns; drag markers only show while dragging;
  // paginator borders follow the table lines.
  datatable: ['filter', 'dropPoint', 'resizeIndicator', 'paginatorTop', 'paginatorBottom'],
}

describe('parts studio', () => {
  it('is registered as a visual editor', () => {
    for (const component of Object.keys(PARTS_STUDIO)) expect(STUDIO_COMPONENTS).toContain(component)
    expect(partsStudio('datatable')).toBeDefined()
    expect(partsStudio('button')).toBeUndefined()
    expect(partsStudio('constructor')).toBeUndefined()
    // Related links point at pattern sections.
    for (const studio of Object.values(PARTS_STUDIO)) {
      for (const link of studio.related ?? []) expect(Object.keys(PATTERN_SECTIONS)).toContain(link.section)
    }
  })

  it('has stage-pick-safe keys', () => {
    for (const studio of Object.values(PARTS_STUDIO)) {
      for (const part of studio.parts) {
        for (const row of part.rows) {
          for (const column of Object.keys(row.cells)) {
            expect(`cell:${part.key}:${row.key}:${column}`).toMatch(STAGE_TARGET_RE)
            expect(part.columns.map(c => c.key), `${part.key}.${row.key}`).toContain(column)
          }
        }
      }
    }
  })

  it('points grid cells at light and dark tokens in every preset', () => {
    for (const [name, preset] of Object.entries(presets)) {
      const descriptors = describePreset(preset)
      for (const [component, studio] of Object.entries(PARTS_STUDIO)) {
        for (const part of studio.parts) {
          for (const row of part.rows) {
            for (const path of Object.values(row.cells)) {
              const cell = componentCell(descriptors, component, path)
              expect(cell.light && cell.dark, `${name} ${component}.${path}`).toBeTruthy()
              expect(cell.light!.kind, `${name} ${component}.${path}`).toBe('color')
            }
          }
        }
      }
    }
  })

  it('covers every color token of the component', () => {
    for (const [name, preset] of Object.entries(presets)) {
      const descriptors = describePreset(preset)
      for (const [component, studio] of Object.entries(PARTS_STUDIO)) {
        const covered = new Set(studio.parts.flatMap(p => p.rows.flatMap(r => Object.values(r.cells))))
        const missing = descriptors
          .filter(t => t.component === component && t.kind === 'color')
          .map(t => componentPath(t))
          .filter(path => !covered.has(path.join('.')) && !ELSEWHERE[component]?.includes(path[0]!))
          .map(path => path.join('.'))
        expect(missing, `${name} ${component}`).toEqual([])
      }
    }
  })

  it('points controls at tokens in every preset', () => {
    for (const [name, preset] of Object.entries(presets)) {
      const descriptors = describePreset(preset)
      for (const [component, studio] of Object.entries(PARTS_STUDIO)) {
        for (const section of studio.sections) {
          for (const control of section.controls) {
            for (const size of (section.sizes ?? ['normal']) as StudioSize[]) {
              const path = controlPath(control, size)
              if (!path) continue
              expect(componentTokens(descriptors, component, path).length, `${name} ${component}.${path}`).toBe(control.schemes ? 2 : 1)
            }
          }
        }
      }
    }
  })

  it('fills both schemes from a shared token and keeps per-scheme ones apart', () => {
    const aura = describePreset(presets.aura!)
    const shared = componentCell(aura, 'datatable', 'row.hoverBackground')
    expect(shared.light).toBe(shared.dark)
    const split = componentCell(aura, 'datatable', 'row.stripedBackground')
    expect(split.light?.scheme).toBe('light')
    expect(split.dark?.scheme).toBe('dark')
    // Lara keeps the header background per scheme, Aura shares it.
    const lara = componentCell(describePreset(presets.lara!), 'datatable', 'header.background')
    expect(lara.light).not.toBe(lara.dark)
    expect(componentTokens(aura, 'datatable', 'nope.color')).toEqual([])
  })
})

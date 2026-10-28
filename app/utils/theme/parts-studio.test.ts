import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { STUDIO_COMPONENTS } from './components'
import { PARTS_STUDIO, componentCell, componentTokens } from './parts-studio'
import { describePreset } from './schema'
import { controlPath, type StudioSize } from './studio-controls'
import type { TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>
const descriptors = Object.fromEntries(Object.entries(presets).map(([name, tree]) => [name, describePreset(tree)]))

describe('parts studios', () => {
  it('are visual editors', () => {
    for (const name of Object.keys(PARTS_STUDIO)) expect(STUDIO_COMPONENTS, name).toContain(name)
  })

  it('have stage-safe row and column keys', () => {
    for (const [name, studio] of Object.entries(PARTS_STUDIO)) {
      for (const key of [...studio.rows.map(r => r.key), ...studio.columns.map(c => c.key)]) expect(key, name).toMatch(/^[a-z]+$/)
    }
  })

  it('point every color cell at a light and a dark token in every base preset', () => {
    for (const [component, studio] of Object.entries(PARTS_STUDIO)) {
      for (const row of studio.rows) {
        for (const [column, path] of Object.entries(row.cells)) {
          expect(studio.columns.map(c => c.key), `${component} ${row.key}`).toContain(column)
          for (const [preset, list] of Object.entries(descriptors)) {
            const cell = componentCell(list, component, path)
            expect(cell.light?.kind, `${preset} ${component}.${path} light`).toBe('color')
            expect(cell.dark?.kind, `${preset} ${component}.${path} dark`).toBe('color')
          }
        }
      }
    }
  })

  it('point every control at a token in every base preset, for every size', () => {
    for (const [component, studio] of Object.entries(PARTS_STUDIO)) {
      for (const section of studio.sections) {
        for (const control of section.controls) {
          for (const size of (section.sizes ?? ['normal']) as StudioSize[]) {
            const path = controlPath(control, size)
            if (!path) continue
            for (const [preset, list] of Object.entries(descriptors)) {
              expect(componentTokens(list, component, path).length, `${preset} ${component}.${path}`).toBeGreaterThan(0)
            }
          }
        }
      }
    }
  })
})

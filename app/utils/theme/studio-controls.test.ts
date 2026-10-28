import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { STUDIO_COMPONENTS } from './components'
import { PARTS_STUDIO } from './parts-studio'
import { STUDIO_CONFIG, controlPath, type StudioSize } from './studio-controls'
import { getPath } from './tree'
import type { TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>

describe('studio controls', () => {
  it('exist for every visual editor (Button is hand-built; parts editors have their own config)', () => {
    for (const name of STUDIO_COMPONENTS.filter(c => c !== 'button')) expect(STUDIO_CONFIG[name] ?? PARTS_STUDIO[name], name).toBeDefined()
  })

  it('point at shared tokens that exist in every base preset', () => {
    for (const [component, config] of Object.entries(STUDIO_CONFIG)) {
      for (const section of config.sections) {
        for (const control of section.controls) {
          for (const size of (section.sizes ?? ['normal']) as StudioSize[]) {
            const path = controlPath(control, size)
            if (!path) continue
            for (const [preset, tree] of Object.entries(presets)) {
              const value = getPath(tree, ['components', component, ...path.split('.')])
              expect(typeof value, `${preset} ${component}.${path}`).toBe('string')
            }
          }
        }
      }
    }
  })
})

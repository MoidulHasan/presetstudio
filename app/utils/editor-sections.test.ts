import { describe, expect, it } from 'vitest'
import { EDITOR_DESTINATIONS, EDITOR_SECTIONS, SECTION_META, destinationOf } from './editor-sections'

describe('editor destinations', () => {
  it('put every section in exactly one destination', () => {
    const placed = EDITOR_DESTINATIONS.flatMap(d => d.sections)
    expect([...placed].sort()).toEqual([...EDITOR_SECTIONS].sort())
    expect(new Set(placed).size).toBe(placed.length)
  })

  it('find the destination of a section', () => {
    expect(destinationOf('start').key).toBe('brand')
    expect(destinationOf('selection').key).toBe('colors')
    expect(destinationOf('focus').key).toBe('shape')
    expect(destinationOf('formfield').key).toBe('components')
    expect(destinationOf('semantic').key).toBe('review')
  })

  it('describe every section', () => {
    for (const section of EDITOR_SECTIONS) expect(SECTION_META[section].label).toBeTruthy()
  })
})

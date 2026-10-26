import { describe, expect, it } from 'vitest'
import { isStagePattern, stageTargetMatches } from './stage-targets'

describe('stageTargetMatches', () => {
  it('matches a target exactly, or everything under a shorter pattern', () => {
    expect(stageTargetMatches('cell:border:focus', 'cell:border:focus')).toBe(true)
    expect(stageTargetMatches('cell:border', 'cell:border:focus')).toBe(true)
    expect(stageTargetMatches('cell:border', 'cell:text:default')).toBe(false)
    expect(stageTargetMatches('cell:border:focus', 'cell:border')).toBe(false)
  })

  it('treats * as any one part', () => {
    expect(stageTargetMatches('*:danger', 'outlined:danger:hover')).toBe(true)
    expect(stageTargetMatches('*:danger:hover', 'root:danger:hover')).toBe(true)
    expect(stageTargetMatches('*:danger:hover', 'root:danger:default')).toBe(false)
    expect(stageTargetMatches('cell:*:focus', 'cell:border:focus')).toBe(true)
  })
})

describe('isStagePattern', () => {
  it('accepts lowercase parts and wildcards only', () => {
    expect(isStagePattern('*:danger')).toBe(true)
    expect(isStagePattern('section:size')).toBe(true)
    expect(isStagePattern('cell:"><img')).toBe(false)
    expect(isStagePattern('a:b:c:d:e')).toBe(false)
    expect(isStagePattern('')).toBe(false)
    expect(isStagePattern(null)).toBe(false)
  })
})

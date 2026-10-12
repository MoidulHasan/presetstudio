import { describe, expect, it } from 'vitest'
import { mergeOverrides, pruneEmpty } from './merge'
import type { TokenTree } from './types'

describe('mergeOverrides', () => {
  it('deep-merges with later trees winning', () => {
    const a: TokenTree = { semantic: { primary: { 500: '#000', 600: '#111' }, focusRing: { width: '1px' } } }
    const b: TokenTree = { semantic: { primary: { 500: '#fff' } } }
    expect(mergeOverrides(a, b)).toEqual({
      semantic: { primary: { 500: '#fff', 600: '#111' }, focusRing: { width: '1px' } },
    })
  })

  it('does not mutate its inputs', () => {
    const a: TokenTree = { semantic: { primary: { 500: '#000' } } }
    const b: TokenTree = { semantic: { primary: { 500: '#fff' } } }
    const snapshot = JSON.stringify([a, b])
    const merged = mergeOverrides(a, b)
    expect(JSON.stringify([a, b])).toBe(snapshot)
    expect(merged.semantic).not.toBe(a.semantic)
  })

  it('lets a leaf replace a branch and a branch replace a leaf', () => {
    expect(mergeOverrides({ a: { b: '1' } }, { a: '2' })).toEqual({ a: '2' })
    expect(mergeOverrides({ a: '2' }, { a: { b: '1' } })).toEqual({ a: { b: '1' } })
  })

  it('skips undefined trees and non-token values', () => {
    const input = { a: '1', b: undefined, c: null, d: [1, 2], e: () => 1, f: Number.NaN, g: 0 } as unknown as TokenTree
    expect(mergeOverrides(undefined, input)).toEqual({ a: '1', g: 0 })
  })

  it('ignores prototype-polluting keys', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}, "constructor": {"x": "1"}, "ok": "1"}')
    const merged = mergeOverrides(malicious)
    expect(merged).toEqual({ ok: '1' })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('pruneEmpty', () => {
  it('removes empty branches recursively', () => {
    expect(pruneEmpty({ a: {}, b: { c: {} }, d: { e: '1' } })).toEqual({ d: { e: '1' } })
  })
})

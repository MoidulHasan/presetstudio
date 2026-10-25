import { describe, expect, it } from 'vitest'
import { canRedo, canUndo, commit, createHistory, redo, restoreHistory, serializeHistory, undo } from './history'

describe('history', () => {
  it('undoes and redoes commits', () => {
    let h = createHistory(1)
    h = commit(h, 2, null, 0)
    h = commit(h, 3, null, 1000)
    expect(h.present).toBe(3)
    h = undo(h)
    expect(h.present).toBe(2)
    h = undo(h)
    expect(h.present).toBe(1)
    expect(canUndo(h)).toBe(false)
    h = redo(h)
    expect(h.present).toBe(2)
    expect(canRedo(h)).toBe(true)
  })

  it('clears the redo stack on a new commit', () => {
    let h = commit(createHistory('a'), 'b')
    h = undo(h)
    h = commit(h, 'c')
    expect(canRedo(h)).toBe(false)
    expect(h.past).toEqual(['a'])
  })

  it('coalesces rapid commits with the same key', () => {
    let h = createHistory(0)
    h = commit(h, 1, 'slider', 1000)
    h = commit(h, 2, 'slider', 1200)
    h = commit(h, 3, 'slider', 1700)
    expect(h.past).toEqual([0])
    // A pause or another key starts a new step.
    h = commit(h, 4, 'slider', 3000)
    h = commit(h, 5, 'other', 3100)
    expect(h.past).toEqual([0, 3, 4])
  })

  it('never coalesces across an undo', () => {
    let h = commit(createHistory(0), 1, 'k', 0)
    h = undo(h)
    h = commit(h, 2, 'k', 10)
    expect(h.past).toEqual([0])
    expect(undo(h).present).toBe(0)
  })

  it('caps the number of steps', () => {
    let h = createHistory(0)
    for (let i = 1; i <= 10; i++) h = commit(h, i, null, i * 1000, { limit: 3 })
    expect(h.past).toEqual([7, 8, 9])
  })

  it('is a no-op at the ends', () => {
    const h = createHistory(0)
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
  })
})

describe('history across reloads', () => {
  const parse = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)
  const same = (a: number, b: number) => a === b
  const build = (...states: number[]) => states.slice(1).reduce((h, s, i) => commit(h, s, null, i * 1000), createHistory(states[0]!))

  it('round-trips undo and redo steps for the same state', () => {
    let h = build(1, 2, 3, 4)
    h = undo(h)
    const restored = restoreHistory(serializeHistory(h), 3, parse, same)!
    expect(restored.past).toEqual([1, 2])
    expect(restored.present).toBe(3)
    expect(restored.future).toEqual([4])
    expect(undo(restored).present).toBe(2)
    expect(redo(restored).present).toBe(4)
  })

  it('keeps the most recent steps', () => {
    const h = build(...Array.from({ length: 50 }, (_, i) => i))
    const restored = restoreHistory(serializeHistory(h, { limit: 10 }), 49, parse, same, { limit: 10 })!
    expect(restored.past).toEqual([39, 40, 41, 42, 43, 44, 45, 46, 47, 48])
  })

  it('drops the oldest steps to fit a size limit', () => {
    const h = build(...Array.from({ length: 30 }, (_, i) => 1000 + i))
    const json = serializeHistory(h, { maxLength: 60 })
    expect(json.length).toBeLessThanOrEqual(60)
    const restored = restoreHistory(json, 1029, parse, same)!
    expect(restored.past.at(-1)).toBe(1028)
  })

  it('turns a stale stored state into one more undo step', () => {
    const h = build(1, 2, 3)
    const restored = restoreHistory(serializeHistory(redo(undo(h))), 9, parse, same)!
    expect(restored.present).toBe(9)
    expect(restored.past).toEqual([1, 2, 3])
    expect(restored.future).toEqual([])
    expect(undo(restored).present).toBe(3)
  })

  it('ignores missing, malformed and invalid input', () => {
    expect(restoreHistory(null, 1, parse, same)).toBeNull()
    expect(restoreHistory('not json', 1, parse, same)).toBeNull()
    expect(restoreHistory('{"present":"x"}', 1, parse, same)).toBeNull()
    expect(restoreHistory(serializeHistory(createHistory(1)), 1, parse, same)).toBeNull()
    // Invalid steps are dropped, valid ones kept.
    const restored = restoreHistory('{"past":[1,"<script>",null,2],"present":3,"future":[{}]}', 3, parse, same)!
    expect(restored.past).toEqual([1, 2])
    expect(restored.future).toEqual([])
  })
})

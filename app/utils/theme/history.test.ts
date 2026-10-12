import { describe, expect, it } from 'vitest'
import { canRedo, canUndo, commit, createHistory, redo, undo } from './history'

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

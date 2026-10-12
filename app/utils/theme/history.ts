// Snapshot-based undo/redo. States are small JSON objects, so snapshots are cheap
// and far simpler (and safer) than inverse patches.

export interface History<T> {
  past: T[]
  present: T
  future: T[]
  /** Key + timestamp of the last commit, used to coalesce rapid edits (e.g. slider drags). */
  lastKey: string | null
  lastAt: number
}

export interface HistoryOptions {
  limit?: number
  /** Commits with the same key within this window replace the previous entry. */
  coalesceMs?: number
}

const DEFAULTS: Required<HistoryOptions> = { limit: 100, coalesceMs: 600 }

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [], lastKey: null, lastAt: 0 }
}

/**
 * Records `next` as the new present. Consecutive commits with the same `key`
 * within `coalesceMs` are merged into one undo step.
 */
export function commit<T>(h: History<T>, next: T, key: string | null = null, now = Date.now(), options: HistoryOptions = {}): History<T> {
  const { limit, coalesceMs } = { ...DEFAULTS, ...options }
  const coalesce = key !== null && key === h.lastKey && now - h.lastAt <= coalesceMs
  const past = coalesce ? h.past : [...h.past, h.present].slice(-limit)
  return { past, present: next, future: [], lastKey: key, lastAt: now }
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h
  const previous = h.past[h.past.length - 1]!
  return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future], lastKey: null, lastAt: 0 }
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h
  const [next, ...future] = h.future
  return { past: [...h.past, h.present], present: next!, future, lastKey: null, lastAt: 0 }
}

export const canUndo = <T>(h: History<T>) => h.past.length > 0
export const canRedo = <T>(h: History<T>) => h.future.length > 0

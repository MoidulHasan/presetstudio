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

// --- Keeping history across reloads ---------------------------------------------------

export interface StoredHistoryOptions {
  /** Undo (and redo) steps kept. */
  limit?: number
  /** Upper bound for the serialized size (characters); the oldest steps go first. */
  maxLength?: number
}

const STORED_DEFAULTS: Required<StoredHistoryOptions> = { limit: 30, maxLength: 1_000_000 }

/** The history as JSON, trimmed to the most recent steps (coalescing state isn't kept). */
export function serializeHistory<T>(h: History<T>, options: StoredHistoryOptions = {}): string {
  const { limit, maxLength } = { ...STORED_DEFAULTS, ...options }
  let past = h.past.slice(-limit)
  let future = h.future.slice(0, limit)
  let json = JSON.stringify({ past, present: h.present, future })
  // Drop the oldest undo steps (then the farthest redo steps) until it fits.
  while (json.length > maxLength && (past.length || future.length)) {
    if (past.length) past = past.slice(Math.ceil(past.length / 4) || 1)
    else future = future.slice(0, Math.floor(future.length * 3 / 4))
    json = JSON.stringify({ past, present: h.present, future })
  }
  return json
}

/**
 * Restores a stored history for the state `current` (untrusted input: every step goes through
 * `parse`, and invalid steps are dropped). When the stored history doesn't end at `current`
 * (the state changed elsewhere, e.g. in another tab), its last state becomes one more undo
 * step and the redo steps are dropped. Null when there's nothing to restore.
 */
export function restoreHistory<T>(
  raw: string | null | undefined,
  current: T,
  parse: (value: unknown) => T | null,
  same: (a: T, b: T) => boolean,
  options: StoredHistoryOptions = {},
): History<T> | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  }
  catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const { past, present, future } = data as { past?: unknown, present?: unknown, future?: unknown }
  const { limit } = { ...STORED_DEFAULTS, ...options }
  const steps = (list: unknown) => (Array.isArray(list) ? list.slice(0, 2 * limit).map(parse).filter((s): s is T => s !== null) : [])
  const stored = parse(present)
  if (!stored) return null
  const pastSteps = steps(past).slice(-limit)
  if (same(stored, current)) {
    const futureSteps = steps(future).slice(0, limit)
    if (!pastSteps.length && !futureSteps.length) return null
    return { past: pastSteps, present: current, future: futureSteps, lastKey: null, lastAt: 0 }
  }
  return { past: [...pastSteps, stored].slice(-limit), present: current, future: [], lastKey: null, lastAt: 0 }
}

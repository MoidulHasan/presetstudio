// Web storage access for the stores. Persistence is best-effort: private mode, a full quota or
// blocked storage must never break the editor, and there's no storage during SSR.

export const WORKSPACE_KEY = 'presetstudio:workspace'
export const LEGACY_THEME_KEY = 'presetstudio:theme'
export const PREFS_KEY = 'presetstudio:prefs'
/** Undo history of one theme (per tab, in sessionStorage): survives reloads, not closing the tab. */
export const historyKey = (themeId: string) => `presetstudio:history:${themeId}`

/** 'local' (localStorage, shared by tabs) or 'session' (sessionStorage, per tab). */
export type StorageArea = 'local' | 'session'

function storage(area: StorageArea): Storage {
  return area === 'session' ? window.sessionStorage : window.localStorage
}

export function readStorage(key: string, area: StorageArea = 'local'): string | null {
  if (!import.meta.client) return null
  try {
    return storage(area).getItem(key)
  }
  catch {
    return null
  }
}

export function writeStorage(key: string, value: string, area: StorageArea = 'local'): void {
  if (!import.meta.client) return
  try {
    storage(area).setItem(key, value)
  }
  catch {
    // Persistence is best-effort.
  }
}

export function removeStorage(key: string, area: StorageArea = 'local'): void {
  if (!import.meta.client) return
  try {
    storage(area).removeItem(key)
  }
  catch {
    // Persistence is best-effort.
  }
}

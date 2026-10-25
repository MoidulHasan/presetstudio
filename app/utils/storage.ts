// localStorage access for the stores. Persistence is best-effort: private mode, a full quota or
// blocked storage must never break the editor, and there's no storage during SSR.

export const WORKSPACE_KEY = 'presetstudio:workspace'
export const LEGACY_THEME_KEY = 'presetstudio:theme'
export const PREFS_KEY = 'presetstudio:prefs'

export function readStorage(key: string): string | null {
  if (!import.meta.client) return null
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(key, value)
  }
  catch {
    // Persistence is best-effort.
  }
}

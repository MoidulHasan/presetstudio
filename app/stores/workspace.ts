import { defineStore } from 'pinia'
import { canRedo, canUndo, commit, createHistory, redo, restoreHistory, serializeHistory, undo, type History } from '~/utils/theme/history'
import {
  createThemeDocument,
  createWorkspace,
  deserializeThemeState,
  deserializeWorkspace,
  mergeWorkspaces,
  parseThemeState,
  sanitizeThemeName,
} from '~/utils/theme/serialize'
import { createDefaultThemeState, type ThemeDocument, type ThemeState, type Workspace } from '~/utils/theme/types'
import { LEGACY_THEME_KEY, WORKSPACE_KEY, historyKey, readStorage, removeStorage, writeStorage } from '~/utils/storage'

// The saved themes (a workspace in localStorage, shared by every tab), the open one and its
// undo history. Every change to a theme goes through `update`.

function loadWorkspace(): Workspace {
  const saved = deserializeWorkspace(readStorage(WORKSPACE_KEY))
  if (saved) return saved
  // Migrate the single v1 theme, if any.
  return createWorkspace(deserializeThemeState(readStorage(LEGACY_THEME_KEY)) ?? undefined)
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

/**
 * A theme state as the history keeps it. In development it's frozen, so code that writes to
 * `theme` directly (skipping `update`, undo and saving) fails loudly instead of silently.
 */
const snapshot = (state: ThemeState): ThemeState => (import.meta.dev ? deepFreeze(clone(state)) : clone(state))

export const useWorkspaceStore = defineStore('workspace', () => {
  const state = ref<Workspace>(loadWorkspace())

  const activeDoc = computed(() => state.value.themes.find(t => t.id === state.value.activeId) ?? state.value.themes[0]!)

  // Undo history of the active theme. Kept per theme in this tab's sessionStorage, so a reload
  // (or an accidental "Reset theme" before one) can still be undone.
  const parseStep = (value: unknown) => {
    const parsed = parseThemeState(value)
    return parsed ? snapshot(parsed) : null
  }
  const sameState = (a: ThemeState, b: ThemeState) => JSON.stringify(a) === JSON.stringify(b)

  function historyFor(doc: ThemeDocument): History<ThemeState> {
    const present = snapshot(doc.theme)
    return restoreHistory(readStorage(historyKey(doc.id), 'session'), present, parseStep, sameState) ?? createHistory(present)
  }

  const history = shallowRef<History<ThemeState>>(historyFor(activeDoc.value))

  let historyTimer: ReturnType<typeof setTimeout> | undefined
  function saveHistory() {
    clearTimeout(historyTimer)
    historyTimer = undefined
    writeStorage(historyKey(activeDoc.value.id), serializeHistory(history.value), 'session')
  }
  watch(history, () => {
    clearTimeout(historyTimer)
    historyTimer = setTimeout(saveHistory, 300)
  })
  /** The open theme. Read-only: change it with `update`. */
  const theme = computed(() => history.value.present)

  function syncActiveDoc() {
    const doc = activeDoc.value
    doc.theme = clone(history.value.present)
    doc.updatedAt = Date.now()
  }

  /**
   * Applies a change to the active theme as one undo step.
   * `key` coalesces rapid edits of the same control (e.g. dragging a slider).
   */
  function update(mutate: (draft: ThemeState) => void, key: string | null = null) {
    const draft = clone(history.value.present)
    mutate(draft)
    if (JSON.stringify(draft) === JSON.stringify(history.value.present)) return
    history.value = commit(history.value, snapshot(draft), key)
    syncActiveDoc()
  }

  function undoChange() {
    history.value = undo(history.value)
    syncActiveDoc()
  }

  function redoChange() {
    history.value = redo(history.value)
    syncActiveDoc()
  }

  // --- Themes ------------------------------------------------------------------------

  function switchTheme(id: string) {
    if (!state.value.themes.some(t => t.id === id) || id === state.value.activeId) return
    // The history being left is saved under its own theme first.
    if (historyTimer !== undefined && state.value.themes.some(t => t.id === state.value.activeId)) saveHistory()
    state.value.activeId = id
    history.value = historyFor(activeDoc.value)
  }

  function createTheme(name: string, from: 'blank' | 'duplicate' = 'blank') {
    const base = from === 'duplicate' ? clone(theme.value) : createDefaultThemeState(theme.value.basePreset)
    const doc = createThemeDocument(sanitizeThemeName(name), base)
    state.value.themes.push(doc)
    switchTheme(doc.id)
  }

  /**
   * Adds a theme from a file or a share link as a new theme (never replacing one) and opens it.
   * `theme` must already be validated (`parseThemeFile`, `decodeShareToken`).
   */
  function importTheme(name: string, theme: ThemeState) {
    const taken = new Set(state.value.themes.map(t => t.name))
    let unique = sanitizeThemeName(name)
    for (let n = 2; taken.has(unique); n++) unique = sanitizeThemeName(`${name.slice(0, 54)} (${n})`)
    const doc = createThemeDocument(unique, clone(theme))
    state.value.themes.push(doc)
    switchTheme(doc.id)
    return doc
  }

  function renameTheme(id: string, name: string) {
    const doc = state.value.themes.find(t => t.id === id)
    if (!doc) return
    doc.name = sanitizeThemeName(name, doc.name)
    doc.updatedAt = Date.now()
  }

  function deleteTheme(id: string) {
    const themes = state.value.themes
    if (themes.length <= 1) return
    const index = themes.findIndex(t => t.id === id)
    if (index < 0) return
    themes.splice(index, 1)
    // Remembered so other tabs' copies don't bring it back.
    state.value.deleted[id] = Date.now()
    removeStorage(historyKey(id), 'session')
    if (state.value.activeId === id) {
      state.value.activeId = ''
      switchTheme(themes[Math.max(0, index - 1)]!.id)
    }
  }

  // --- Persistence -------------------------------------------------------------------
  // Several tabs share one saved workspace: each save and each change another tab saves are
  // merged per theme (newest wins, deletes stick), so no tab overwrites another's work.

  /** Latest change another tab made to the open theme (shown as a toast); the id makes repeats observable. */
  const externalChange = shallowRef<{ kind: 'updated' | 'deleted', name: string, id: number } | null>(null)
  let externalId = 0

  function adoptWorkspace(merged: Workspace) {
    if (JSON.stringify(merged) === JSON.stringify(state.value)) return
    const previous = { id: activeDoc.value.id, name: activeDoc.value.name }
    state.value = merged
    const doc = activeDoc.value
    if (doc.id !== previous.id) {
      removeStorage(historyKey(previous.id), 'session')
      history.value = historyFor(doc)
      externalChange.value = { kind: 'deleted', name: previous.name, id: ++externalId }
    }
    else if (JSON.stringify(doc.theme) !== JSON.stringify(history.value.present)) {
      // One undo step, so this tab's version is one Undo away.
      history.value = commit(history.value, snapshot(doc.theme))
      externalChange.value = { kind: 'updated', name: doc.name, id: ++externalId }
    }
  }

  /** Whether the last save reached the browser's storage (the top bar says when it didn't). */
  const saved = ref(true)
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  function save() {
    clearTimeout(saveTimer)
    saveTimer = undefined
    const stored = deserializeWorkspace(readStorage(WORKSPACE_KEY))
    if (stored) adoptWorkspace(mergeWorkspaces(state.value, stored))
    saved.value = writeStorage(WORKSPACE_KEY, JSON.stringify(state.value))
  }
  watch(state, () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 250)
  }, { deep: true })

  if (import.meta.client) {
    // Closing or hiding the tab within the debounce would otherwise lose the last edit.
    const flush = () => {
      if (saveTimer !== undefined) save()
      if (historyTimer !== undefined) saveHistory()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    // Fired for saves made by other tabs only.
    window.addEventListener('storage', (event) => {
      if (event.key !== WORKSPACE_KEY) return
      const remote = deserializeWorkspace(event.newValue)
      if (remote) adoptWorkspace(mergeWorkspaces(state.value, remote))
    })
  }

  return {
    saved,
    state,
    activeDoc,
    theme,
    update,
    undo: undoChange,
    redo: redoChange,
    canUndo: computed(() => canUndo(history.value)),
    canRedo: computed(() => canRedo(history.value)),
    switchTheme,
    createTheme,
    importTheme,
    renameTheme,
    deleteTheme,
    externalChange,
  }
})

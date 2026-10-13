import { defineStore } from 'pinia'
import { buildEffectivePreset, buildPresetOverrides } from '~/utils/theme/build'
import { designToTokens } from '~/utils/theme/design'
import { checkContrast, classifyContrast, type ClassifiedContrast } from '~/utils/theme/contrast'
import { countTokens, generatePresetCode, presetFileBase, presetIdentifier } from '~/utils/theme/export'
import { canRedo, canUndo, commit, createHistory, redo, undo, type History } from '~/utils/theme/history'
import { PREVIEW_CATEGORIES, PREVIEW_TEMPLATES, type PreviewCategory, type PreviewTemplate } from '~/utils/theme/messages'
import { loadBasePreset } from '~/utils/theme/presets'
import { describePreset } from '~/utils/theme/schema'
import { DESIGN_SECTIONS, isPristine, isSectionModified, resetSection, type DesignSection } from '~/utils/theme/sections'
import { COMPONENT_META, STUDIO_COMPONENTS, countComponentOverrides, isComponentName } from '~/utils/theme/components'
import { clearRecolor, recolorOverrides, type PaletteChoice } from '~/utils/theme/recolor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { countSemanticOverrides } from '~/utils/theme/semantic'
import { deletePath, setPath } from '~/utils/theme/tree'
import { sanitizeTokenValue } from '~/utils/theme/values'
import {
  createThemeDocument,
  createWorkspace,
  deserializeThemeState,
  deserializeWorkspace,
  sanitizeThemeName,
} from '~/utils/theme/serialize'
import { createResolver, type TokenResolver } from '~/utils/theme/tokens'
import {
  COLOR_SCHEMES,
  SHADES,
  createDefaultThemeState,
  type ColorPalette,
  type ColorScheme,
  type ThemeState,
  type TokenTree,
  type Workspace,
} from '~/utils/theme/types'

const WORKSPACE_KEY = 'presetstudio:workspace'
const LEGACY_THEME_KEY = 'presetstudio:theme'
const PREFS_KEY = 'presetstudio:prefs'

export const EDITOR_SECTIONS = ['start', ...DESIGN_SECTIONS, 'semantic', 'components', 'accessibility'] as const
export type EditorSection = (typeof EDITOR_SECTIONS)[number]

export const PREVIEW_VIEWPORTS = ['full', 'tablet', 'mobile'] as const
export type PreviewViewport = (typeof PREVIEW_VIEWPORTS)[number]

export const UI_THEMES = ['system', 'light', 'dark'] as const
export type UiTheme = (typeof UI_THEMES)[number]

interface EditorPrefs {
  /** Scheme shown in the preview and edited by scheme-aware panels. */
  colorScheme: ColorScheme
  section: EditorSection
  /** Show light and dark previews side by side. */
  split: boolean
  template: PreviewTemplate
  /** Gallery category for the 'components' template; shared by both side-by-side panes. */
  category: PreviewCategory
  viewport: PreviewViewport
  /** Draw every preview component in its focused state. */
  showFocus: boolean
  /** Component open in the component tokens editor (null: the component list). */
  component: string | null
  /** Inspect mode: click a component in the preview to open its tokens. */
  inspect: boolean
  /** Below lg only one pane shows at a time. */
  pane: 'edit' | 'preview'
  /** Show a component's stage (all variants and states) instead of the preview page. */
  stage: boolean
  /** Component editor view: visual controls or the full token list. */
  componentView: 'design' | 'tokens'
  /** While held: preview the open component without its edits. */
  compare: boolean
  /** One-time tips the user has dismissed. */
  dismissedTips: string[]
  /** The editor's own color scheme (independent of the theme being designed). */
  uiTheme: UiTheme
}

function readStorage(key: string): string | null {
  if (!import.meta.client) return null
  try {
    return window.localStorage.getItem(key)
  }
  catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(key, value)
  }
  catch {
    // Persistence is best-effort (private mode, quota, blocked storage).
  }
}

function loadWorkspace(): Workspace {
  const saved = deserializeWorkspace(readStorage(WORKSPACE_KEY))
  if (saved) return saved
  // Migrate the single v1 theme, if any.
  return createWorkspace(deserializeThemeState(readStorage(LEGACY_THEME_KEY)) ?? undefined)
}

function loadPrefs(): EditorPrefs {
  const fallback: EditorPrefs = { colorScheme: 'light', section: 'start', split: false, template: 'components', category: 'form', viewport: 'full', showFocus: false, component: null, inspect: false, pane: 'edit', stage: true, componentView: 'design', compare: false, dismissedTips: [], uiTheme: 'system' }
  try {
    const raw = JSON.parse(readStorage(PREFS_KEY) ?? 'null') as Partial<EditorPrefs> | null
    return {
      colorScheme: COLOR_SCHEMES.includes(raw?.colorScheme as ColorScheme) ? raw!.colorScheme! : fallback.colorScheme,
      section: EDITOR_SECTIONS.includes(raw?.section as EditorSection) ? raw!.section! : fallback.section,
      split: typeof raw?.split === 'boolean' ? raw.split : fallback.split,
      template: PREVIEW_TEMPLATES.includes(raw?.template as PreviewTemplate) ? raw!.template! : fallback.template,
      category: PREVIEW_CATEGORIES.includes(raw?.category as PreviewCategory) ? raw!.category! : fallback.category,
      viewport: PREVIEW_VIEWPORTS.includes(raw?.viewport as PreviewViewport) ? raw!.viewport! : fallback.viewport,
      // A view toggle for the current session (the Focus section turns it on by itself).
      showFocus: fallback.showFocus,
      component: isComponentName(raw?.component) ? raw.component : fallback.component,
      inspect: fallback.inspect,
      pane: fallback.pane,
      stage: typeof raw?.stage === 'boolean' ? raw.stage : fallback.stage,
      componentView: raw?.componentView === 'tokens' ? 'tokens' : fallback.componentView,
      compare: fallback.compare,
      dismissedTips: Array.isArray(raw?.dismissedTips) ? raw.dismissedTips.filter((t): t is string => typeof t === 'string').slice(0, 20) : [],
      uiTheme: UI_THEMES.includes(raw?.uiTheme as UiTheme) ? raw!.uiTheme! : fallback.uiTheme,
    }
  }
  catch {
    return fallback
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const useEditorStore = defineStore('editor', () => {
  const workspace = ref<Workspace>(loadWorkspace())
  const prefs = ref<EditorPrefs>(loadPrefs())

  const activeDoc = computed(() => workspace.value.themes.find(t => t.id === workspace.value.activeId) ?? workspace.value.themes[0]!)

  // Undo history for the active theme; reset when switching themes.
  const history = shallowRef<History<ThemeState>>(createHistory(clone(activeDoc.value.theme)))
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
    history.value = commit(history.value, draft, key)
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

  // --- Base preset + derived data ------------------------------------------------

  const basePreset = shallowRef<TokenTree | null>(null)
  let loadToken = 0
  watch(
    () => theme.value.basePreset,
    async (name) => {
      const token = ++loadToken
      const preset = (await loadBasePreset(name)) as unknown as TokenTree
      if (token === loadToken) basePreset.value = preset
    },
    { immediate: true },
  )

  const effectivePreset = computed(() => (basePreset.value ? buildEffectivePreset(theme.value, basePreset.value) : null))

  const resolvers = computed<Record<ColorScheme, TokenResolver> | null>(() => {
    const preset = effectivePreset.value
    if (!preset) return null
    return { light: createResolver(preset, 'light'), dark: createResolver(preset, 'dark') }
  })

  /** Resolved 50–950 scale of a palette token group (e.g. 'primary', 'surface') for a scheme. */
  function resolvedScale(group: string, scheme: ColorScheme = prefs.value.colorScheme): ColorPalette | null {
    const resolver = resolvers.value?.[scheme]
    if (!resolver) return null
    return Object.fromEntries(SHADES.map(s => [s, resolver.resolve(`${group}-${s}`)?.value ?? 'transparent'])) as ColorPalette
  }

  // Contrast of the untouched base preset, to tell inherited problems from new ones.
  const baselineContrast = computed(() => {
    const base = basePreset.value
    return base ? { light: checkContrast(createResolver(base, 'light')), dark: checkContrast(createResolver(base, 'dark')) } : null
  })

  const contrast = computed<Record<ColorScheme, ClassifiedContrast[]> | null>(() => {
    const r = resolvers.value
    const baseline = baselineContrast.value
    if (!r || !baseline) return null
    return {
      light: classifyContrast(checkContrast(r.light), baseline.light),
      dark: classifyContrast(checkContrast(r.dark), baseline.dark),
    }
  })

  /** Contrast failures introduced by this theme (not inherited from the base preset). */
  const contrastIssues = computed(() => {
    const c = contrast.value
    return c ? [...c.light, ...c.dark].filter(r => r.status === 'introduced').length : 0
  })

  // --- Token-level editing ---------------------------------------------------------

  /** Every token of the base preset with inferred kind and labels. */
  const descriptors = computed(() => (basePreset.value ? describePreset(basePreset.value) : []))

  /** Tokens set by design decisions (to tell 'design' from 'base' values). */
  const designTokens = computed(() => (basePreset.value ? designToTokens(theme.value.design, basePreset.value) : {}))

  const semanticOverrideCount = computed(() => countSemanticOverrides(theme.value.overrides))

  /** Sets a raw token override. Returns false if the value isn't a safe token value. */
  function setToken(path: string[], value: string): boolean {
    const safe = sanitizeTokenValue(value)
    if (safe === null) return false
    update((d) => {
      d.overrides = setPath(d.overrides, path, safe)
    }, `token:${path.join('.')}`)
    return true
  }

  function resetToken(path: string[]) {
    update((d) => {
      d.overrides = deletePath(d.overrides, path)
    })
  }

  function resetSemantic() {
    update((d) => {
      d.overrides = deletePath(d.overrides, ['semantic'])
    })
  }

  // --- Component tokens ---------------------------------------------------------------

  /** Custom token count per component. */
  const componentOverrideCounts = computed(() => countComponentOverrides(theme.value.overrides))
  const componentOverrideCount = computed(() => Object.values(componentOverrideCounts.value).reduce((n, c) => n + c, 0))

  /** Clears the custom tokens of one component, or of every component. */
  function resetComponents(component: string | null = null) {
    update((d) => {
      d.overrides = deletePath(d.overrides, component ? ['components', component] : ['components'])
    })
  }

  /** Latest request to scroll a component into view in the preview (the id makes repeats observable). */
  const revealRequest = shallowRef<{ component: string, id: number } | null>(null)
  /** Whether the preview found the last revealed component, and the components it's built from. */
  const revealed = ref<{ component: string, found: boolean, uses: string[] } | null>(null)
  let revealId = 0

  function revealComponent(component: string) {
    revealed.value = null
    revealRequest.value = { component, id: ++revealId }
  }

  function reportRevealed(component: string, found: boolean, uses: string[] = []) {
    // Side by side, either pane finding it counts.
    const current = revealed.value
    if (current?.component === component && current.found) return
    revealed.value = { component, found, uses }
  }

  /** Opens a component's tokens and shows it in the preview. */
  function openComponent(component: string) {
    if (!isComponentName(component)) return
    prefs.value.section = 'components'
    prefs.value.component = component
    // Components with a visual editor always open in it, with their stage in the preview.
    if (STUDIO_COMPONENTS.includes(component)) {
      prefs.value.componentView = 'design'
      prefs.value.stage = true
    }
    const { category } = COMPONENT_META[component]!
    // Keep "All"; otherwise switch the gallery to the component's category.
    if (prefs.value.template === 'components' && prefs.value.category !== 'all') prefs.value.category = category
    revealComponent(component)
  }

  // --- Component studio ----------------------------------------------------------------

  /** Component whose stage the preview shows, if any. */
  const activeStage = computed(() => {
    const component = prefs.value.component
    return prefs.value.section === 'components' && prefs.value.stage && prefs.value.componentView === 'design'
      && component && STUDIO_COMPONENTS.includes(component)
      ? component
      : null
  })

  /** Latest click on the stage ('root:danger:hover'); the id makes repeats observable. */
  const stagePick = shallowRef<{ target: string, id: number } | null>(null)
  let pickId = 0
  function pickOnStage(target: string) {
    stagePick.value = { target, id: ++pickId }
  }

  /** Recolors a group of a component's tokens (e.g. Button 'info') with a palette, or resets it (null). */
  function recolorGroup(component: string, group: string, tokens: TokenDescriptor[], choice: PaletteChoice | null) {
    const r = resolvers.value
    if (!r) return
    update((d) => {
      d.overrides = choice
        ? recolorOverrides(d.overrides, tokens, r, component, group, choice)
        : clearRecolor(d.overrides, tokens, component, group)
    }, choice?.kind === 'custom' ? `recolor:${component}:${group}` : null)
  }

  const modifiedSections = computed(() => new Set(DESIGN_SECTIONS.filter(s => isSectionModified(theme.value, s))))

  function resetDesignSection(section: DesignSection) {
    update(draft => Object.assign(draft, resetSection(draft, section)))
  }

  const exportInfo = computed(() => {
    const base = basePreset.value
    const identifier = presetIdentifier(activeDoc.value.name)
    const fileBase = presetFileBase(activeDoc.value.name)
    if (!base) return { identifier, fileBase, code: '', tokenCount: 0 }
    return {
      identifier,
      fileBase,
      code: generatePresetCode(theme.value, base, { name: identifier }),
      tokenCount: countTokens(buildPresetOverrides(theme.value, base)),
    }
  })

  // --- Theme management ------------------------------------------------------------

  function switchTheme(id: string) {
    if (!workspace.value.themes.some(t => t.id === id) || id === workspace.value.activeId) return
    workspace.value.activeId = id
    history.value = createHistory(clone(activeDoc.value.theme))
  }

  function createTheme(name: string, from: 'blank' | 'duplicate' = 'blank') {
    const base = from === 'duplicate' ? clone(theme.value) : createDefaultThemeState(theme.value.basePreset)
    const doc = createThemeDocument(sanitizeThemeName(name), base)
    workspace.value.themes.push(doc)
    switchTheme(doc.id)
  }

  function renameTheme(id: string, name: string) {
    const doc = workspace.value.themes.find(t => t.id === id)
    if (doc) doc.name = sanitizeThemeName(name, doc.name)
  }

  function deleteTheme(id: string) {
    const themes = workspace.value.themes
    if (themes.length <= 1) return
    const index = themes.findIndex(t => t.id === id)
    if (index < 0) return
    themes.splice(index, 1)
    if (workspace.value.activeId === id) {
      workspace.value.activeId = ''
      switchTheme(themes[Math.max(0, index - 1)]!.id)
    }
  }

  function resetTheme() {
    update(draft => Object.assign(draft, createDefaultThemeState(draft.basePreset)))
  }

  // --- Persistence -------------------------------------------------------------------

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  watch(workspace, (value) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => writeStorage(WORKSPACE_KEY, JSON.stringify(value)), 250)
  }, { deep: true })
  watch(prefs, value => writeStorage(PREFS_KEY, JSON.stringify(value)), { deep: true })

  return {
    workspace,
    prefs,
    activeDoc,
    theme,
    basePreset,
    resolvers,
    contrast,
    contrastIssues,
    modifiedSections,
    pristine: computed(() => isPristine(theme.value)),
    descriptors,
    designTokens,
    semanticOverrideCount,
    componentOverrideCounts,
    componentOverrideCount,
    resetComponents,
    revealRequest,
    revealed,
    revealComponent,
    reportRevealed,
    openComponent,
    activeStage,
    stagePick,
    pickOnStage,
    recolorGroup,
    setToken,
    resetToken,
    resetSemantic,
    resetSection: resetDesignSection,
    exportInfo,
    canUndo: computed(() => canUndo(history.value)),
    canRedo: computed(() => canRedo(history.value)),
    update,
    undo: undoChange,
    redo: redoChange,
    resolvedScale,
    switchTheme,
    createTheme,
    renameTheme,
    deleteTheme,
    resetTheme,
  }
})

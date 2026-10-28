import { defineStore } from 'pinia'
import { PREVIEW_CATEGORIES, PREVIEW_TEMPLATES, type HighlightMode, type PreviewCategory, type PreviewTemplate } from '~/utils/theme/messages'
import { COMPONENT_META, STUDIO_COMPONENTS, isComponentName, studioFor } from '~/utils/theme/components'
import { withoutComponent } from '~/utils/theme/recolor'
import { PATTERN_SECTIONS, semanticStageName, semanticStudio, withoutSemanticGroup, type PatternSection } from '~/utils/theme/semantic-studio'
import { FOUNDATION_STAGES, type FoundationSection } from '~/utils/theme/stages'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { groupKeyOf } from '~/utils/theme/semantic'
import { COLOR_SCHEMES, type ColorScheme, type TokenTree } from '~/utils/theme/types'
import {
  EDITOR_LAYOUTS,
  EDITOR_SECTIONS,
  PREVIEW_VIEWPORTS,
  SECTION_META,
  SECTION_PAGES,
  UI_THEMES,
  isPreviewPage,
  pageForComponent,
  type EditorLayout,
  type EditorSection,
  type PreviewPage,
  type PreviewViewport,
  type UiTheme,
} from '~/utils/editor-sections'
import { PREFS_KEY, readStorage, writeStorage } from '~/utils/storage'
import { useWorkspaceStore } from './workspace'

// The editor UI: preferences (section, preview options, views), what the preview's stage shows,
// and navigation between sections, components and the preview (reveal, stage picks, Compare).
// Theme data lives in the workspace store, derived preset data in the preset store.

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
  /** Pattern section view (and Text): visual controls or the group's token list. */
  semanticView: 'design' | 'tokens'
  /** The editor's own color scheme (independent of the theme being designed). */
  uiTheme: UiTheme
  /** The editor's layout: two panes (default) or the classic three. */
  layout: EditorLayout
  /** The first-run setup was finished or skipped (it then only opens for a new theme). */
  setupDone: boolean
  /** Below lg, while editing: the preview shows as a strip above the controls. */
  previewStrip: boolean
  /** "In an app" pages picked by hand, per section ('formfield') or component ('component:datatable'). */
  pages: Record<string, PreviewPage>
  /** "In an app": dim the components the open section doesn't change. */
  spotlight: boolean
}

const MAX_PAGE_PICKS = 100

function loadPagePicks(raw: unknown): Record<string, PreviewPage> {
  if (!raw || typeof raw !== 'object') return {}
  const picks = Object.entries(raw).filter(([key, page]) => key.length <= 64 && isPreviewPage(page)).slice(0, MAX_PAGE_PICKS)
  return Object.fromEntries(picks) as Record<string, PreviewPage>
}

function loadPrefs(): EditorPrefs {
  const fallback: EditorPrefs = { colorScheme: 'light', section: 'start', split: false, template: 'dashboard', category: 'form', viewport: 'full', showFocus: false, component: null, inspect: false, pane: 'edit', stage: true, componentView: 'design', compare: false, dismissedTips: [], semanticView: 'design', uiTheme: 'system', layout: 'panels', setupDone: false, previewStrip: true, pages: {}, spotlight: true }
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
      semanticView: raw?.semanticView === 'tokens' ? 'tokens' : fallback.semanticView,
      dismissedTips: Array.isArray(raw?.dismissedTips) ? raw.dismissedTips.filter((t): t is string => typeof t === 'string').slice(0, 20) : [],
      uiTheme: UI_THEMES.includes(raw?.uiTheme as UiTheme) ? raw!.uiTheme! : fallback.uiTheme,
      layout: EDITOR_LAYOUTS.includes(raw?.layout as EditorLayout) ? raw!.layout! : fallback.layout,
      // Saved prefs from before the setup existed belong to people who know the editor.
      setupDone: raw ? raw.setupDone !== false : fallback.setupDone,
      previewStrip: typeof raw?.previewStrip === 'boolean' ? raw.previewStrip : fallback.previewStrip,
      pages: loadPagePicks(raw?.pages),
      spotlight: typeof raw?.spotlight === 'boolean' ? raw.spotlight : fallback.spotlight,
    }
  }
  catch {
    return fallback
  }
}

export const useEditorStore = defineStore('editor', () => {
  const workspace = useWorkspaceStore()
  const prefs = ref<EditorPrefs>(loadPrefs())
  watch(prefs, value => writeStorage(PREFS_KEY, JSON.stringify(value)), { deep: true })

  // --- Sections ----------------------------------------------------------------------

  /** Semantic group edited by the current section (pattern sections and Text), if any. */
  const sectionGroup = computed(() => PATTERN_SECTIONS[prefs.value.section as PatternSection] ?? null)

  /** Switches a pattern section's panel between its visual editor and its token list (the preview keeps its stage). */
  function setSemanticView(view: 'design' | 'tokens') {
    prefs.value.semanticView = view
  }

  // --- Stage ---------------------------------------------------------------------------

  /** Component with a visual editor that's open (its stage is available, in either view), if any. */
  const stageComponent = computed(() => {
    const component = prefs.value.component
    return prefs.value.section === 'components' && component && STUDIO_COMPONENTS.includes(component) ? component : null
  })

  /**
   * Stage available for the current section ('button', 'semantic-formfield', 'foundation-shape').
   * Independent of the panel's Design / All tokens view: both edit what the stage shows.
   */
  const stageName = computed(() => {
    if (stageComponent.value) return stageComponent.value
    if (sectionGroup.value) return semanticStageName(sectionGroup.value)
    return FOUNDATION_STAGES[prefs.value.section as FoundationSection] ?? null
  })

  /** What the stage shows, for the preview toolbar. */
  const stageLabel = computed(() => {
    if (stageComponent.value) return COMPONENT_META[stageComponent.value]?.label ?? stageComponent.value
    if (sectionGroup.value) return semanticStudio(sectionGroup.value)?.label ?? ''
    return SECTION_META[prefs.value.section]?.label ?? ''
  })

  /** Stage the preview shows, if any (the user can switch to the pages). */
  const activeStage = computed(() => (prefs.value.stage ? stageName.value : null))

  /**
   * Latest click on the stage ('root:danger:hover'), handled by the Design view of the stage's
   * editor (`useStagePick`); the id makes repeats observable.
   */
  const stagePick = shallowRef<{ target: string, id: number, stage: string | null } | null>(null)
  let pickId = 0
  function pickOnStage(target: string) {
    // The token list doesn't handle picks: bring up the Design view, which has the clicked control.
    if (stageComponent.value) prefs.value.componentView = 'design'
    else if (sectionGroup.value) prefs.value.semanticView = 'design'
    stagePick.value = { target, id: ++pickId, stage: stageName.value }
  }
  // A pick nobody handled belongs to its stage; drop it rather than replay it in another editor.
  watch(stageName, (name) => {
    if (stagePick.value && stagePick.value.stage !== name) stagePick.value = null
  })

  /**
   * What a control in the panel points at on the stage (a target pattern, see stage-targets.ts):
   * held while it's hovered or focused, a pulse after a change. The id makes repeats observable.
   */
  const stageHint = shallowRef<{ target: string | null, mode: HighlightMode, id: number } | null>(null)
  let hintId = 0
  function pointAtStage(target: string | null, mode: HighlightMode) {
    stageHint.value = { target, mode, id: ++hintId }
  }

  /** Overrides with the open editor's own edits removed, while Compare is held. */
  function compareOverrides(): TokenTree {
    const overrides = workspace.theme.overrides
    if (!prefs.value.compare) return overrides
    if (stageComponent.value) return withoutComponent(overrides, stageComponent.value)
    if (prefs.value.section === 'components' && prefs.value.component) return withoutComponent(overrides, prefs.value.component)
    if (sectionGroup.value) return withoutSemanticGroup(overrides, sectionGroup.value)
    return overrides
  }

  // --- Components and the preview ----------------------------------------------------

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

  /** Shows every component in the gallery (catalog sections). */
  function showAllComponents() {
    prefs.value.template = 'components'
    prefs.value.category = 'all'
  }

  /** Opens a section; the preview follows (its stage, and its page "In an app"). */
  function openSection(section: EditorSection) {
    prefs.value.section = section
  }

  // --- What "In an app" shows --------------------------------------------------------------
  // Every section (and component) has a page where what it changes shows up; a page picked by
  // hand is remembered for that section. The preview switches when the section does.

  /** The section, or the open component, the page belongs to. */
  const previewKey = computed(() => (prefs.value.section === 'components' && prefs.value.component ? `component:${prefs.value.component}` : prefs.value.section))

  const suggestedPage = computed<PreviewPage>(() => {
    const component = prefs.value.section === 'components' ? prefs.value.component : null
    const meta = component ? COMPONENT_META[component] : null
    return meta ? pageForComponent(meta.category) : SECTION_PAGES[prefs.value.section]
  })

  const currentPage = computed<PreviewPage>(() => (prefs.value.template === 'components' ? `gallery:${prefs.value.category}` : `page:${prefs.value.template}`))

  function showPage(page: PreviewPage) {
    const [kind, name] = page.split(':') as [string, string]
    if (kind === 'gallery') {
      prefs.value.template = 'components'
      prefs.value.category = name as PreviewCategory
    }
    else prefs.value.template = name as PreviewTemplate
  }

  /** Shows a page and remembers it for this section (the suggestion needs no remembering). */
  function choosePage(page: PreviewPage) {
    showPage(page)
    const key = previewKey.value
    const { [key]: _previous, ...others } = prefs.value.pages
    prefs.value.pages = page === suggestedPage.value ? others : { ...others, [key]: page }
  }

  watch(previewKey, key => showPage(prefs.value.pages[key] ?? suggestedPage.value), { immediate: true })

  /**
   * Opens a component: in its visual editor (with the stage) when it has one or belongs to one
   * (SplitButton → Button), otherwise, or with `view: 'tokens'`, in the token list.
   */
  function openComponent(component: string, options: { view?: 'design' | 'tokens' } = {}) {
    if (!isComponentName(component)) return
    const studio = options.view === 'tokens' ? null : studioFor(component)
    prefs.value.section = 'components'
    prefs.value.component = studio ?? component
    if (studio) {
      prefs.value.componentView = 'design'
      // A family member opens its section of the editor.
      if (studio !== component) pickOnStage(`family:${component}`)
    }
    else if (options.view === 'tokens') {
      prefs.value.componentView = 'tokens'
    }
    // The preview switches to the component's page (previewKey). A component's own stage shows
    // it already; family members are found on their parent's stage.
    if (studio !== component) revealComponent(component)
  }

  /**
   * Latest request to show one token in a token list (from search): the list that holds it
   * filters to it and expands it. The id makes repeats observable.
   */
  const tokenRequest = shallowRef<{ name: string, key: string, component: string | null, group: string | null, id: number } | null>(null)
  let tokenRequestId = 0

  /**
   * Opens the token list that holds a token: a component's tokens, its shared style's token
   * list, or All tokens (semantic groups without a section of their own).
   */
  function openToken(token: TokenDescriptor) {
    const component = token.layer === 'component' ? token.component ?? null : null
    const group = component ? null : groupKeyOf(token)
    if (component) {
      openComponent(component, { view: 'tokens' })
    }
    else {
      const section = (Object.keys(PATTERN_SECTIONS) as PatternSection[]).find(key => PATTERN_SECTIONS[key] === group)
      if (section) {
        openSection(section)
        prefs.value.semanticView = 'tokens'
      }
      else {
        openSection('semantic')
      }
    }
    tokenRequest.value = { name: token.name, key: token.path.join('.'), component, group, id: ++tokenRequestId }
  }

  /** A request to open the Export drawer on one of its tabs (from panels; editor.vue opens it). */
  const exportRequest = shallowRef<{ tab: 'app' | 'share', id: number } | null>(null)
  let exportId = 0
  function requestExport(tab: 'app' | 'share') {
    exportRequest.value = { tab, id: ++exportId }
  }

  // --- First-run setup --------------------------------------------------------------------
  /** The setup (pick a look, brand color, corners, neutrals) replaces the editor's panels. */
  const setupOpen = ref(false)

  function openSetup() {
    openSection('start')
    setupOpen.value = true
  }

  /** Finished or skipped: the editor opens on Brand, and the setup doesn't come back by itself. */
  function closeSetup() {
    setupOpen.value = false
    prefs.value.setupDone = true
    openSection('start')
  }

  /** Opens the list of every component (the preview shows the whole gallery, or the page picked for it). */
  function openComponentList() {
    prefs.value.section = 'components'
    prefs.value.component = null
  }

  return {
    prefs,
    sectionGroup,
    setSemanticView,
    stageComponent,
    stageName,
    stageLabel,
    activeStage,
    stagePick,
    pickOnStage,
    compareOverrides,
    stageHint,
    pointAtStage,
    revealRequest,
    revealed,
    revealComponent,
    reportRevealed,
    showAllComponents,
    openSection,
    openComponent,
    openComponentList,
    previewKey,
    suggestedPage,
    currentPage,
    choosePage,
    tokenRequest,
    openToken,
    exportRequest,
    requestExport,
    setupOpen,
    openSetup,
    closeSetup,
  }
})

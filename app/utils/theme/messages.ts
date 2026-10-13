import { isComponentName } from './components'
import { parseThemeState } from './serialize'
import { COLOR_SCHEMES, type ColorScheme, type ThemeState } from './types'

// Typed postMessage protocol between /editor (parent) and /preview (iframe).
export const MESSAGE_CHANNEL = 'presetstudio'

export const PREVIEW_TEMPLATES = ['components', 'dashboard', 'form', 'settings'] as const
export type PreviewTemplate = (typeof PREVIEW_TEMPLATES)[number]

/** Component gallery categories (the 'components' template). */
export const GALLERY_CATEGORIES = ['form', 'button', 'data', 'panel', 'overlay', 'menu', 'messages', 'media', 'file', 'misc'] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

/** What the gallery shows: one category, or every category (loaded as they scroll into view). */
export const PREVIEW_CATEGORIES = ['all', ...GALLERY_CATEGORIES] as const
export type PreviewCategory = (typeof PREVIEW_CATEGORIES)[number]

/** How the preview should present itself (not part of the theme). */
export interface PreviewView {
  template: PreviewTemplate
  category: PreviewCategory
  /** Side by side, only one pane shows a scrollbar (the panes scroll together). */
  hideScrollbar: boolean
  /** Draw every component in its focused state. */
  showFocus: boolean
  /** Inspect mode: hovering highlights a component, clicking reports it instead of interacting. */
  inspect: boolean
  /** Component stage to show instead of the page (every variant and state, light and dark). */
  stage: string | null
}

export type ApplyMessage = {
  channel: typeof MESSAGE_CHANNEL
  type: 'theme:apply'
  state: ThemeState
  colorScheme: ColorScheme
} & PreviewView

const DEFAULT_VIEW: PreviewView = { template: 'components', category: 'form', hideScrollbar: false, showFocus: false, inspect: false, stage: null }

/** Scroll position of a preview (side-by-side panes scroll together). */
export interface ScrollPosition {
  x: number
  y: number
}

export type ScrollToMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:scroll-to' } & ScrollPosition
/** Scroll a component into view and flash it. */
export type RevealMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:reveal', component: string }
export type EditorToPreviewMessage = ApplyMessage | ScrollToMessage | RevealMessage

export type ReadyMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:ready' }
export type ScrollMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:scroll' } & ScrollPosition
/** A component was clicked in inspect mode. */
export type InspectMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:inspect', component: string }
/** Whether a reveal found the component on the current preview page, and the components it's built from. */
export type RevealedMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:revealed', component: string, found: boolean, uses: string[] }
/** Something on the component stage was clicked, e.g. 'root:danger:hover' (style, variant, state). */
export type StagePickMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:stage-pick', target: string }
export type PreviewToEditorMessage = ReadyMessage | ScrollMessage | InspectMessage | RevealedMessage | StagePickMessage

const STAGE_TARGET_RE = /^[a-z]+(?::[a-z]+){0,3}$/

const MAX_SCROLL = 1_000_000

function parseScroll(data: Record<string, unknown>): ScrollPosition | null {
  const { x, y } = data
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x: Math.min(Math.max(x, 0), MAX_SCROLL), y: Math.min(Math.max(y, 0), MAX_SCROLL) }
}

interface MessageEventLike {
  origin: string
  data: unknown
}

/** Same-origin check. Both sides must call this before trusting `event.data`. */
export function isSameOrigin(event: Pick<MessageEventLike, 'origin'>, expectedOrigin: string): boolean {
  return event.origin === expectedOrigin && expectedOrigin !== 'null'
}

function hasChannel(data: unknown): data is { channel: string, type: unknown } & Record<string, unknown> {
  return typeof data === 'object' && data !== null && (data as { channel?: unknown }).channel === MESSAGE_CHANNEL
}

/** Parses a message received by the preview. Returns null if untrusted or malformed. */
export function parseEditorMessage(event: MessageEventLike, expectedOrigin: string): EditorToPreviewMessage | null {
  if (!isSameOrigin(event, expectedOrigin) || !hasChannel(event.data)) return null
  if (event.data.type === 'theme:apply') {
    const state = parseThemeState(event.data.state)
    const scheme = event.data.colorScheme
    const template = event.data.template
    if (!state || !(COLOR_SCHEMES as readonly unknown[]).includes(scheme)) return null
    const category = event.data.category
    if (!(PREVIEW_TEMPLATES as readonly unknown[]).includes(template)) return null
    if (!(PREVIEW_CATEGORIES as readonly unknown[]).includes(category)) return null
    if (typeof event.data.hideScrollbar !== 'boolean' || typeof event.data.showFocus !== 'boolean' || typeof event.data.inspect !== 'boolean') return null
    const stage = event.data.stage
    if (stage !== null && !isComponentName(stage)) return null
    return {
      channel: MESSAGE_CHANNEL,
      type: 'theme:apply',
      state,
      colorScheme: scheme as ColorScheme,
      template: template as PreviewTemplate,
      category: category as PreviewCategory,
      hideScrollbar: event.data.hideScrollbar,
      showFocus: event.data.showFocus,
      inspect: event.data.inspect,
      stage,
    }
  }
  if (event.data.type === 'preview:scroll-to') {
    const position = parseScroll(event.data)
    return position ? { channel: MESSAGE_CHANNEL, type: 'preview:scroll-to', ...position } : null
  }
  if (event.data.type === 'preview:reveal' && isComponentName(event.data.component)) {
    return { channel: MESSAGE_CHANNEL, type: 'preview:reveal', component: event.data.component }
  }
  return null
}

/** Parses a message received by the editor. Returns null if untrusted or malformed. */
export function parsePreviewMessage(event: MessageEventLike, expectedOrigin: string): PreviewToEditorMessage | null {
  if (!isSameOrigin(event, expectedOrigin) || !hasChannel(event.data)) return null
  if (event.data.type === 'preview:ready') return { channel: MESSAGE_CHANNEL, type: 'preview:ready' }
  if (event.data.type === 'preview:scroll') {
    const position = parseScroll(event.data)
    return position ? { channel: MESSAGE_CHANNEL, type: 'preview:scroll', ...position } : null
  }
  if (event.data.type === 'preview:inspect' && isComponentName(event.data.component)) {
    return { channel: MESSAGE_CHANNEL, type: 'preview:inspect', component: event.data.component }
  }
  if (event.data.type === 'preview:revealed' && isComponentName(event.data.component) && typeof event.data.found === 'boolean') {
    const uses = Array.isArray(event.data.uses) ? event.data.uses.filter(isComponentName).slice(0, 20) : []
    return { channel: MESSAGE_CHANNEL, type: 'preview:revealed', component: event.data.component, found: event.data.found, uses }
  }
  if (event.data.type === 'preview:stage-pick' && typeof event.data.target === 'string' && event.data.target.length <= 60 && STAGE_TARGET_RE.test(event.data.target)) {
    return { channel: MESSAGE_CHANNEL, type: 'preview:stage-pick', target: event.data.target }
  }
  return null
}

export function createApplyMessage(state: ThemeState, colorScheme: ColorScheme, view: Partial<PreviewView> = {}): ApplyMessage {
  // Plain clone so reactive proxies never cross the postMessage boundary.
  return {
    channel: MESSAGE_CHANNEL,
    type: 'theme:apply',
    state: JSON.parse(JSON.stringify(state)),
    colorScheme,
    ...DEFAULT_VIEW,
    ...view,
  }
}

export function createReadyMessage(): ReadyMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:ready' }
}

export function createScrollMessage({ x, y }: ScrollPosition): ScrollMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:scroll', x, y }
}

export function createScrollToMessage({ x, y }: ScrollPosition): ScrollToMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:scroll-to', x, y }
}

export function createRevealMessage(component: string): RevealMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:reveal', component }
}

export function createInspectMessage(component: string): InspectMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:inspect', component }
}

export function createRevealedMessage(component: string, found: boolean, uses: string[] = []): RevealedMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:revealed', component, found, uses }
}

export function createStagePickMessage(target: string): StagePickMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:stage-pick', target }
}

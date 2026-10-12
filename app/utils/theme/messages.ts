import { parseThemeState } from './serialize'
import { COLOR_SCHEMES, type ColorScheme, type ThemeState } from './types'

// Typed postMessage protocol between /editor (parent) and /preview (iframe).
export const MESSAGE_CHANNEL = 'presetstudio'

export const PREVIEW_TEMPLATES = ['components', 'dashboard', 'form', 'settings'] as const
export type PreviewTemplate = (typeof PREVIEW_TEMPLATES)[number]

/** Component gallery categories (the 'components' template). */
export const PREVIEW_CATEGORIES = ['form', 'button', 'data', 'panel', 'overlay', 'menu', 'messages', 'media', 'file', 'misc'] as const
export type PreviewCategory = (typeof PREVIEW_CATEGORIES)[number]

export type EditorToPreviewMessage = {
  channel: typeof MESSAGE_CHANNEL
  type: 'theme:apply'
  state: ThemeState
  colorScheme: ColorScheme
  template: PreviewTemplate
  category: PreviewCategory
}

export type PreviewToEditorMessage = { channel: typeof MESSAGE_CHANNEL, type: 'preview:ready' }

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
    return {
      channel: MESSAGE_CHANNEL,
      type: 'theme:apply',
      state,
      colorScheme: scheme as ColorScheme,
      template: template as PreviewTemplate,
      category: category as PreviewCategory,
    }
  }
  return null
}

/** Parses a message received by the editor. Returns null if untrusted or malformed. */
export function parsePreviewMessage(event: MessageEventLike, expectedOrigin: string): PreviewToEditorMessage | null {
  if (!isSameOrigin(event, expectedOrigin) || !hasChannel(event.data)) return null
  if (event.data.type === 'preview:ready') return { channel: MESSAGE_CHANNEL, type: 'preview:ready' }
  return null
}

export function createApplyMessage(
  state: ThemeState,
  colorScheme: ColorScheme,
  template: PreviewTemplate = 'components',
  category: PreviewCategory = 'form',
): EditorToPreviewMessage {
  // Plain clone so reactive proxies never cross the postMessage boundary.
  return { channel: MESSAGE_CHANNEL, type: 'theme:apply', state: JSON.parse(JSON.stringify(state)), colorScheme, template, category }
}

export function createReadyMessage(): PreviewToEditorMessage {
  return { channel: MESSAGE_CHANNEL, type: 'preview:ready' }
}

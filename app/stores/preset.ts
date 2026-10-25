import { defineStore } from 'pinia'
import { buildEffectivePreset, buildPresetOverrides } from '~/utils/theme/build'
import { designToTokens } from '~/utils/theme/design'
import { checkContrast, classifyContrast, type ClassifiedContrast } from '~/utils/theme/contrast'
import { countTokens, generatePresetCode, presetFileBase, presetIdentifier } from '~/utils/theme/export'
import { loadBasePreset } from '~/utils/theme/presets'
import { describePreset, type TokenDescriptor } from '~/utils/theme/schema'
import { DESIGN_SECTIONS, isPristine, isSectionModified, resetSection, type DesignSection } from '~/utils/theme/sections'
import { countComponentOverrides } from '~/utils/theme/components'
import { clearRecolor, recolorOverrides, type PaletteChoice } from '~/utils/theme/recolor'
import { countSemanticOverrides } from '~/utils/theme/semantic'
import { SEMANTIC_STUDIO_KEYS, countSemanticGroup, withoutSemanticGroup } from '~/utils/theme/semantic-studio'
import { deletePath, getPath, setPath } from '~/utils/theme/tree'
import { sanitizeTokenValue } from '~/utils/theme/values'
import { createResolver, type TokenResolver } from '~/utils/theme/tokens'
import {
  SHADES,
  createDefaultThemeState,
  type BasePresetName,
  type ColorPalette,
  type ColorScheme,
  type TokenTree,
} from '~/utils/theme/types'
import { stableComputed } from '~/composables/stableComputed'
import { useWorkspaceStore } from './workspace'

/** A token that follows another one's edit (set to `value`, usually a reference). */
export interface LinkedToken {
  path: string[]
  value: string
}

// The open theme as a preset: its base preset (loaded on demand), the resolved tokens, contrast,
// counts and export, and the token-level edits made in panels.

export const usePresetStore = defineStore('preset', () => {
  const workspace = useWorkspaceStore()
  const theme = computed(() => workspace.theme)
  const update = workspace.update

  // --- Base preset -------------------------------------------------------------------

  const loadedPreset = shallowRef<{ name: BasePresetName, preset: TokenTree } | null>(null)
  /** Base preset that failed to load (e.g. a stale chunk after a deploy); a reload fixes it. */
  const basePresetError = ref<BasePresetName | null>(null)
  let loadToken = 0
  watch(
    () => theme.value.basePreset,
    async (name) => {
      const token = ++loadToken
      try {
        const preset = (await loadBasePreset(name)) as unknown as TokenTree
        if (token !== loadToken) return
        loadedPreset.value = { name, preset }
        basePresetError.value = null
      }
      catch (error) {
        if (token !== loadToken) return
        console.error(`Couldn't load the ${name} preset`, error)
        basePresetError.value = name
      }
    },
    { immediate: true },
  )

  // Only the theme's own base preset: while another one loads, derived data waits instead of
  // mixing the previous base with the new theme.
  const basePreset = computed(() => (loadedPreset.value?.name === theme.value.basePreset ? loadedPreset.value.preset : null))

  // --- Resolved tokens ---------------------------------------------------------------

  const effectivePreset = computed(() => (basePreset.value ? buildEffectivePreset(theme.value, basePreset.value) : null))

  const resolvers = computed<Record<ColorScheme, TokenResolver> | null>(() => {
    const preset = effectivePreset.value
    if (!preset) return null
    return { light: createResolver(preset, 'light'), dark: createResolver(preset, 'dark') }
  })

  /** Resolvers of the untouched base preset, to compare the theme with the preset's own values. */
  const baseResolvers = computed<Record<ColorScheme, TokenResolver> | null>(() => {
    const base = basePreset.value
    return base ? { light: createResolver(base, 'light'), dark: createResolver(base, 'dark') } : null
  })

  /** Resolved 50–950 scale of a palette token group (e.g. 'primary', 'surface') in a scheme. */
  function resolvedScale(group: string, scheme: ColorScheme): ColorPalette | null {
    const resolver = resolvers.value?.[scheme]
    if (!resolver) return null
    return Object.fromEntries(SHADES.map(s => [s, resolver.resolve(`${group}-${s}`)?.value ?? 'transparent'])) as ColorPalette
  }

  /** Every token of the base preset with inferred kind and labels. */
  const descriptors = computed(() => (basePreset.value ? describePreset(basePreset.value) : []))

  /** Tokens set by design decisions (to tell 'design' from 'base' values). */
  const designTokens = computed(() => (basePreset.value ? designToTokens(theme.value.design, basePreset.value) : {}))

  // --- Contrast ----------------------------------------------------------------------

  // Contrast of the untouched base preset, to tell inherited problems from new ones.
  const baselineContrast = computed(() => {
    const r = baseResolvers.value
    return r ? { light: checkContrast(r.light), dark: checkContrast(r.dark) } : null
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

  // --- What's changed ----------------------------------------------------------------

  const semanticOverrideCount = computed(() => countSemanticOverrides(theme.value.overrides))

  /** Custom value count per semantic group. */
  const semanticGroupCounts = stableComputed(() =>
    Object.fromEntries(SEMANTIC_STUDIO_KEYS.map(key => [key, countSemanticGroup(theme.value.overrides, key)])) as Record<string, number>)

  /** Custom token count per component. */
  const componentOverrideCounts = stableComputed(() => countComponentOverrides(theme.value.overrides))
  const componentOverrideCount = computed(() => Object.values(componentOverrideCounts.value).reduce((n, c) => n + c, 0))

  const modifiedSections = stableComputed(
    () => new Set(DESIGN_SECTIONS.filter(s => isSectionModified(theme.value, s))),
    sections => [...sections].join(),
  )
  const pristine = computed(() => isPristine(theme.value))

  // --- Token edits -------------------------------------------------------------------

  /**
   * Sets a raw token override. Returns false if the value isn't a safe token value.
   * `linked` tokens follow along in the same undo step, unless they already have their own
   * value (e.g. SplitButton's wrapper radius follows Button's corner radius).
   */
  function setToken(path: string[], value: string, linked: LinkedToken[] = []): boolean {
    const safe = sanitizeTokenValue(value)
    if (safe === null) return false
    update((d) => {
      d.overrides = setPath(d.overrides, path, safe)
      for (const link of linked) {
        if (getPath(d.overrides, link.path) === undefined) d.overrides = setPath(d.overrides, link.path, link.value)
      }
    }, `token:${path.join('.')}`)
    return true
  }

  /** Removes a token override, and linked tokens that still only follow it. */
  function resetToken(path: string[], linked: LinkedToken[] = []) {
    update((d) => {
      d.overrides = deletePath(d.overrides, path)
      for (const link of linked) {
        if (getPath(d.overrides, link.path) === link.value) d.overrides = deletePath(d.overrides, link.path)
      }
    })
  }

  /** Clears the custom values of one semantic group, or of every semantic token. */
  function resetSemantic(group: string | null = null) {
    update((d) => {
      d.overrides = group ? withoutSemanticGroup(d.overrides, group) : deletePath(d.overrides, ['semantic'])
    })
  }

  /** Clears the custom tokens of one component, or of every component. */
  function resetComponents(component: string | null = null) {
    update((d) => {
      d.overrides = deletePath(d.overrides, component ? ['components', component] : ['components'])
      // Links that only followed this component (SplitButton's radius → Button's) go too.
      const others = d.overrides.components
      if (component && others && typeof others === 'object') {
        const prefix = `{${component}.`
        const walk = (node: TokenTree, path: string[]) => {
          for (const [key, value] of Object.entries(node)) {
            if (typeof value === 'object') walk(value, [...path, key])
            else if (typeof value === 'string' && value.startsWith(prefix) && /^\{[^{}]+\}$/.test(value)) d.overrides = deletePath(d.overrides, [...path, key])
          }
        }
        walk(others, ['components'])
      }
    })
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

  function resetDesignSection(section: DesignSection) {
    update(draft => Object.assign(draft, resetSection(draft, section)))
  }

  function resetTheme() {
    update(draft => Object.assign(draft, createDefaultThemeState(draft.basePreset)))
  }

  // --- Export ------------------------------------------------------------------------

  const exportInfo = computed(() => {
    const base = basePreset.value
    const identifier = presetIdentifier(workspace.activeDoc.name)
    const fileBase = presetFileBase(workspace.activeDoc.name)
    if (!base) return { identifier, fileBase, code: '', tokenCount: 0 }
    return {
      identifier,
      fileBase,
      code: generatePresetCode(theme.value, base, { name: identifier }),
      tokenCount: countTokens(buildPresetOverrides(theme.value, base)),
    }
  })

  return {
    basePreset,
    basePresetError,
    resolvers,
    baseResolvers,
    resolvedScale,
    descriptors,
    designTokens,
    contrast,
    contrastIssues,
    semanticOverrideCount,
    semanticGroupCounts,
    componentOverrideCounts,
    componentOverrideCount,
    modifiedSections,
    pristine,
    setToken,
    resetToken,
    resetSemantic,
    resetComponents,
    recolorGroup,
    resetSection: resetDesignSection,
    resetTheme,
    exportInfo,
  }
})

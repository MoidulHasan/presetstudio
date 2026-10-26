import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { STUDIO_FAMILY } from '~/utils/theme/components'
import { statusComponents } from '~/utils/theme/design'
import { semanticUsedBy } from '~/utils/theme/semantic-studio'

/**
 * The components the open section changes, kept lit "In an app" while the rest is dimmed: the
 * same lists "Used by N components" shows. Null for sections that reach everything (surfaces,
 * text, shape, density, focus) or edit nothing in particular (Brand, Review): nothing is dimmed.
 */
export function useSpotlightComponents() {
  const editor = useEditorStore()
  const preset = usePresetStore()

  return stableComputed<string[] | null>(() => {
    const section = editor.prefs.section
    const component = section === 'components' ? editor.prefs.component : null
    if (component) {
      // A visual editor also edits its family (Button: SplitButton, SpeedDial).
      return [component, ...Object.keys(STUDIO_FAMILY).filter(name => STUDIO_FAMILY[name] === component)]
    }
    const group = editor.sectionGroup
    if (group && group !== 'text') return semanticUsedBy(preset.descriptors, group)
    if (section === 'primary') return semanticUsedBy(preset.descriptors, 'primary')
    if (section === 'status') return preset.basePreset ? statusComponents(preset.basePreset) : null
    return null
  }, list => list?.join(',') ?? '')
}

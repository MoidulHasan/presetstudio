import { usePresetStore } from '~/stores/preset'
import type { EditorSection } from '~/utils/editor-sections'
import { PATTERN_SECTIONS, type PatternSection } from '~/utils/theme/semantic-studio'
import type { DesignSection } from '~/utils/theme/sections'

/** Whether the theme changes what a section edits (the "changed" dots in navigation). */
export function useSectionStatus() {
  const preset = usePresetStore()

  function isModified(section: EditorSection): boolean {
    if (section === 'semantic') return preset.semanticOverrideCount > 0
    if (section === 'components') return preset.componentOverrideCount > 0
    const group = PATTERN_SECTIONS[section as PatternSection]
    if (group) return (preset.semanticGroupCounts[group] ?? 0) > 0
    return preset.modifiedSections.has(section as DesignSection)
  }

  return { isModified }
}

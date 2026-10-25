<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { componentPath } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { BUTTON_STYLE_LABELS, buttonVariants, type ButtonStyle, type StudioState } from '~/utils/theme/studio'

// Visual editor for Button: colors per variant (shared VariantColors), then shape, size, text
// and effects, and the Button family (SplitButton, SpeedDial, ButtonGroup).
const editor = useEditorStore()
const preset = usePresetStore()

const buttonTokens = computed(() => preset.descriptors.filter(t => t.component === 'button'))
const variants = computed(() => buttonVariants(preset.descriptors))
const styleLabel = (style: string) => BUTTON_STYLE_LABELS[style as ButtonStyle] ?? style

/** Shared (both modes) Button token by its path below `components.button`, e.g. 'root.paddingX'. */
function shared(path: string): TokenDescriptor | undefined {
  return buttonTokens.value.find(t => t.scheme === null && componentPath(t).join('.') === path)
}

// --- Size ----------------------------------------------------------------------------
const size = ref<'sm' | 'normal' | 'lg'>('normal')
const sizePath = (key: string) => (size.value === 'normal' ? `root.${key}` : `root.${size.value}.${key}`)

// --- Button family ---------------------------------------------------------------------
/** Shared token of another component of the family, e.g. ('splitbutton', 'root.borderRadius'). */
function familyToken(component: string, path: string): TokenDescriptor | undefined {
  return preset.descriptors.find(t => t.component === component && t.scheme === null && componentPath(t).join('.') === path)
}
const { current: familyHighlight, flash: flashFamily } = useFlash<string>()

// SplitButton's own radius only shapes its wrapper (the outline of the raised shadow); its
// halves are Buttons. It follows Button's corner radius, so the shadow fits the buttons.
const splitWrapperLink = computed(() => {
  const wrapper = familyToken('splitbutton', 'root.borderRadius')
  return wrapper ? [{ path: wrapper.path, value: '{button.border.radius}' }] : []
})
const buttonRadius = computed(() => preset.resolvers?.light.resolve('button-border-radius')?.value ?? '')
const familyChanged = (component: string) => (preset.componentOverrideCounts[component] ?? 0) > 0

// --- Stage picks -----------------------------------------------------------------------
const sections = ref<Record<string, HTMLElement | null>>({})
const colors = ref<{ focus: (key: string, style: string, state: StudioState) => Promise<void> } | null>(null)

useStagePick(async ([style, key, state]) => {
  if (style === 'size' || style === 'shape' || style === 'family') {
    sections.value[style]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    if (style === 'family' && key) flashFamily(key)
    return
  }
  if (key && style) await colors.value?.focus(key, style, (state as StudioState) ?? 'default')
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorStudioVariantColors
      ref="colors"
      component="button"
      :variants="variants"
      :style-label="styleLabel"
      description="One palette recolors a variant in every style and state and in both modes, keeping the preset's shades."
    />

    <!-- Shape -->
    <div :ref="el => (sections.shape = el as HTMLElement | null)">
      <EditorInspectorGroup
        title="Shape"
        description="Corner radius is for every button and follows the form field radius from the Shape section by default. Pill radius is only for buttons with the rounded prop; anything over half the button's height makes fully round ends."
      >
        <EditorStudioLength
          :token="shared('root.borderRadius')"
          label="Corner radius"
          hint="all buttons"
          :linked="splitWrapperLink"
          :max="24"
        />
        <EditorStudioLength
          :token="shared('root.roundedBorderRadius')"
          label="Pill radius"
          hint="buttons with rounded"
          :max="48"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Size -->
    <div :ref="el => (sections.size = el as HTMLElement | null)">
      <EditorInspectorGroup title="Size and spacing">
        <SelectButton
          v-model="size"
          :options="[{ value: 'sm', label: 'Small' }, { value: 'normal', label: 'Normal' }, { value: 'lg', label: 'Large' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Button size to edit"
          size="small"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        />
        <EditorStudioLength
          :token="shared(sizePath('paddingX'))"
          label="Horizontal padding"
        />
        <EditorStudioLength
          :token="shared(sizePath('paddingY'))"
          label="Vertical padding"
          :max="24"
        />
        <EditorStudioLength
          v-if="size !== 'normal'"
          :token="shared(sizePath('fontSize'))"
          label="Font size"
          :min="8"
          :max="28"
        />
        <EditorStudioLength
          :token="shared(sizePath('iconOnlyWidth'))"
          label="Icon-only width"
          :min="16"
          :max="72"
        />
        <EditorStudioLength
          v-if="size === 'normal'"
          :token="shared('root.gap')"
          label="Gap between icon and label"
          :max="24"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Text -->
    <EditorInspectorGroup title="Text">
      <EditorStudioWeight
        v-if="shared('root.label.fontWeight')"
        :token="shared('root.label.fontWeight')!"
        label="Label weight"
      />
    </EditorInspectorGroup>

    <!-- Effects -->
    <EditorInspectorGroup
      title="Effects"
      description="The shadow of raised buttons. Focus rings are set for all components in Focus ring."
    >
      <EditorStudioShadow
        v-if="shared('root.raisedShadow')"
        :token="shared('root.raisedShadow')!"
        label="Raised shadow"
      />
      <EditorStudioLength
        :token="shared('root.badgeSize')"
        label="Badge size"
        :min="8"
        :max="32"
      />
    </EditorInspectorGroup>

    <!-- Button family: components built from Button, with a few tokens of their own -->
    <div :ref="el => (sections.family = el as HTMLElement | null)">
      <EditorInspectorGroup
        title="Button family"
        description="These are built from Button, so its colors, sizes and padding above already apply. Here are the few settings of their own."
      >
        <div
          class="flex flex-col gap-3 rounded-lg border p-3 transition-colors"
          :class="familyHighlight === 'splitbutton' ? 'border-surface-900 dark:border-surface-0' : 'border-surface-200 dark:border-surface-700'"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="flex items-center gap-1.5 text-sm font-semibold">
              SplitButton
              <span
                v-if="familyChanged('splitbutton')"
                class="size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
                aria-hidden="true"
              />
            </p>
            <Button
              label="All tokens"
              size="small"
              text
              class="!py-0.5 !text-xs"
              @click="editor.openComponent('splitbutton', { view: 'tokens' })"
            />
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400">
            <span class="font-medium text-surface-700 dark:text-surface-200">Corner radius</span> follows Button's corner radius above ({{ buttonRadius }}): both halves are Buttons.
          </p>
          <EditorStudioLength
            :token="familyToken('splitbutton', 'root.roundedBorderRadius')"
            label="Pill radius"
            hint="with rounded"
            :max="48"
          />
          <EditorStudioShadow
            v-if="familyToken('splitbutton', 'root.raisedShadow')"
            :token="familyToken('splitbutton', 'root.raisedShadow')!"
            label="Raised shadow"
          />
        </div>

        <div
          class="flex flex-col gap-3 rounded-lg border p-3 transition-colors"
          :class="familyHighlight === 'speeddial' ? 'border-surface-900 dark:border-surface-0' : 'border-surface-200 dark:border-surface-700'"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="flex items-center gap-1.5 text-sm font-semibold">
              SpeedDial
              <span
                v-if="familyChanged('speeddial')"
                class="size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
                aria-hidden="true"
              />
            </p>
            <Button
              label="All tokens"
              size="small"
              text
              class="!py-0.5 !text-xs"
              @click="editor.openComponent('speeddial', { view: 'tokens' })"
            />
          </div>
          <EditorStudioLength
            :token="familyToken('speeddial', 'root.gap')"
            label="Gap between actions"
            :max="32"
          />
        </div>

        <p class="text-xs text-surface-500 dark:text-surface-400">
          <span class="font-medium text-surface-700 dark:text-surface-200">ButtonGroup</span> has no settings of its own: it joins Buttons and follows everything above.
        </p>
      </EditorInspectorGroup>
    </div>

    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every Button token is there.
    </p>
  </div>
</template>

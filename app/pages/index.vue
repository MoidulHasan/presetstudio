<script setup lang="ts">
import Aura from '@primeuix/themes/aura'
import { REPO_URL } from '~/utils/site'
import { EXAMPLE_THEMES, SPECIMEN_COMPONENTS, landingTheme, type LandingChoices, type LandingCorners } from '~/utils/landing'
import { generatePresetCode } from '~/utils/theme/export'
import { loadBasePreset } from '~/utils/theme/presets'
import { encodeShareToken, shareUrl, startPath } from '~/utils/theme/share'
import { specimenVars } from '~/utils/theme/specimen'
import { BASE_PRESETS, BASE_PRESET_LABELS, type BasePresetName, type TokenTree } from '~/utils/theme/types'

useSeoMeta({
  title: 'Preset Studio: theme PrimeVue around your brand',
  description: 'Pick a base style and your brand color, adjust colors, corners, density and single components with a live preview, then export a PrimeVue 4 preset. Free, open source, runs in your browser.',
  ogTitle: 'Preset Studio: theme PrimeVue around your brand',
  ogDescription: 'A free, open-source visual theme editor for PrimeVue 4.',
})

// Base presets: Aura ships with the site (the editor's own theme is built on it); the others
// load when they're first shown.
const presets = shallowRef<Partial<Record<BasePresetName, TokenTree>>>({ aura: Aura as unknown as TokenTree })

async function ensurePreset(name: BasePresetName) {
  if (presets.value[name]) return
  const preset = (await loadBasePreset(name)) as unknown as TokenTree
  presets.value = { ...presets.value, [name]: preset }
}

function varsFor(choices: LandingChoices): Record<string, string> | null {
  const base = presets.value[choices.base]
  return base ? specimenVars(landingTheme(choices), base, SPECIMEN_COMPONENTS) : null
}

// --- The try-it hero ---------------------------------------------------------------------
const choices = ref<LandingChoices>({ base: 'aura', brand: '#0d9488', corners: 'base' })
const theme = computed(() => landingTheme(choices.value))
const heroVars = computed(() => varsFor(choices.value) ?? {})

async function chooseBase(name: BasePresetName) {
  await ensurePreset(name)
  choices.value = { ...choices.value, base: name }
}

const baseOptions = BASE_PRESETS.map(name => ({ value: name, label: BASE_PRESET_LABELS[name] }))
const cornerOptions: Array<{ value: LandingCorners, label: string }> = [
  { value: 'none', label: 'Square' },
  { value: 'base', label: 'Default' },
  { value: 'large', label: 'Rounded' },
  { value: 'xlarge', label: 'Soft' },
]

const opening = ref<string | null>(null)

/** The choices continue in the editor's setup (or, with themes already there, as a new one). */
async function continueInEditor() {
  opening.value = 'hero'
  try {
    await navigateTo(startPath(await encodeShareToken('New theme', theme.value)))
  }
  finally {
    opening.value = null
  }
}

// What the choices above export to: a real excerpt, not a mock.
const code = computed(() => {
  const base = presets.value[choices.value.base]
  return base ? generatePresetCode(theme.value, base, { name: 'MyPreset' }) : ''
})

// --- Example themes ------------------------------------------------------------------------
onMounted(() => {
  for (const name of BASE_PRESETS) void ensurePreset(name)
})

// Null until the example's base preset has loaded (they're drawn after hydration).
const exampleVars = computed(() => EXAMPLE_THEMES.map(example => varsFor(example.choices)))

async function openExample(name: string, choicesOf: LandingChoices) {
  opening.value = name
  try {
    await navigateTo(shareUrl('', await encodeShareToken(name, landingTheme(choicesOf))))
  }
  finally {
    opening.value = null
  }
}

const capabilities = [
  { title: 'Four base styles', text: 'Aura, Lara, Nora and Material, each with its own borders, focus and selection style.' },
  { title: 'Palettes from one color', text: 'A full 50 to 950 scale in OKLCH, with hover, active and focus states derived from it.' },
  { title: 'Shared styles', text: 'Form fields, lists, menus and overlays look alike across the components that use them. Change one and they all follow.' },
  { title: 'Component editors', text: 'Button, Message, Toast, Tag and Badge show every variant and state at once, in light and dark.' },
  { title: 'Every token, when you need it', text: 'Around 3,000 tokens per preset, searchable, for the details a visual control doesn’t cover.' },
  { title: 'Contrast check', text: 'Text and controls are checked in both color schemes, with the pairs that fail listed.' },
  { title: 'A change list you can undo', text: 'See everything you changed from the base preset and revert any single change.' },
  { title: 'Nothing to sign up for', text: 'Themes are saved in your browser. Share one as a link or a file.' },
]
</script>

<template>
  <div class="text-surface-900">
    <!-- Hero: the visitor's own choices restyle a piece of a real app. -->
    <section class="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:pt-16">
      <div class="flex min-w-0 flex-col gap-8">
        <div class="flex flex-col gap-5">
          <h1 class="max-w-[15ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[3.4rem]">
            Theme PrimeVue around your brand
          </h1>
          <p class="max-w-[46ch] text-lg leading-relaxed text-surface-600">
            Choose a base style and your brand color, and the components on the right take them on.
            Preset Studio turns the same choices into a complete preset for PrimeVue&nbsp;4, free and in your browser.
          </p>
        </div>

        <div class="flex flex-col gap-6">
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-medium">
              Brand color
            </legend>
            <EditorBrandColorField v-model="choices.brand" />
          </fieldset>
          <div class="flex flex-col gap-2">
            <span
              id="hero-base"
              class="text-sm font-medium"
            >Base style</span>
            <SelectButton
              :model-value="choices.base"
              :options="baseOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-labelledby="hero-base"
              class="w-full"
              :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
              @update:model-value="chooseBase"
            />
          </div>
          <div class="flex flex-col gap-2">
            <span
              id="hero-corners"
              class="text-sm font-medium"
            >Corners</span>
            <SelectButton
              v-model="choices.corners"
              :options="cornerOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-labelledby="hero-corners"
              class="w-full"
              :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <Button
            label="Continue in the editor"
            size="large"
            :loading="opening === 'hero'"
            @click="continueInEditor"
          />
          <Button
            as="a"
            :href="REPO_URL"
            target="_blank"
            rel="noopener"
            label="Source on GitHub"
            icon="pi pi-github"
            severity="secondary"
            size="large"
            text
          />
        </div>
      </div>

      <!-- The canvas: like the editor's preview, the only place the theme applies. -->
      <div class="flex min-w-0 items-center justify-center rounded-3xl bg-surface-100 p-5 sm:p-10">
        <LandingSpecimen
          :vars="heroVars"
          class="w-full max-w-md"
        />
      </div>
    </section>

    <!-- How it works: a real sequence, so it's numbered. -->
    <section
      class="border-t border-surface-200"
      aria-labelledby="how"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2
          id="how"
          class="mb-12 text-3xl font-semibold tracking-[-0.025em]"
        >
          From a color to a preset
        </h2>
        <div class="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
          <ol class="flex flex-col gap-10">
            <li class="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span
                class="text-lg font-semibold tabular-nums text-surface-400"
                aria-hidden="true"
              >1</span>
              <div>
                <h3 class="text-lg font-semibold">
                  Start from your brand
                </h3>
                <p class="mt-1 text-surface-600">
                  A short setup asks for a base style, your brand color, corners and grays. Everything else follows from them.
                </p>
              </div>
            </li>
            <li class="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span
                class="text-lg font-semibold tabular-nums text-surface-400"
                aria-hidden="true"
              >2</span>
              <div>
                <h3 class="text-lg font-semibold">
                  Adjust what you need
                </h3>
                <p class="mt-1 text-surface-600">
                  Colors, density and focus rings for everything at once, or one component at a time. Light and dark side by side, on sample pages or every state of a component.
                </p>
              </div>
            </li>
            <li class="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span
                class="text-lg font-semibold tabular-nums text-surface-400"
                aria-hidden="true"
              >3</span>
              <div>
                <h3 class="text-lg font-semibold">
                  Take it to your app
                </h3>
                <p class="mt-1 text-surface-600">
                  Export a <code class="font-mono text-[0.9em]">definePreset</code> file with setup steps for Nuxt or Vue, or send the theme to a teammate as a link.
                </p>
              </div>
            </li>
          </ol>
          <figure class="flex min-w-0 flex-col gap-2">
            <pre class="max-h-[26rem] overflow-auto rounded-2xl border border-surface-200 bg-surface-50 p-5 font-mono text-[0.8125rem] leading-relaxed text-surface-800"><code>{{ code }}</code></pre>
            <figcaption class="text-sm text-surface-500">
              The export for the choices at the top of this page.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Example themes: live, and each opens in the editor as a new theme. -->
    <section
      class="border-t border-surface-200"
      aria-labelledby="examples"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div class="mb-10 flex max-w-2xl flex-col gap-2">
          <h2
            id="examples"
            class="text-3xl font-semibold tracking-[-0.025em]"
          >
            Four themes to start from
          </h2>
          <p class="text-surface-600">
            Made in Preset Studio from a handful of choices each. Open one to keep going from there.
          </p>
        </div>
        <ul class="grid gap-x-8 gap-y-12 md:grid-cols-2">
          <li
            v-for="(example, index) in EXAMPLE_THEMES"
            :key="example.name"
            class="flex min-w-0 flex-col gap-4"
          >
            <div class="flex min-h-[20rem] items-center justify-center rounded-2xl bg-surface-100 p-5 sm:p-8">
              <LandingSpecimen
                v-if="exampleVars[index]"
                :vars="exampleVars[index]!"
                compact
                class="w-full max-w-sm"
              />
            </div>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-semibold">
                  {{ example.name }}
                </h3>
                <p class="text-sm text-surface-600">
                  {{ example.description }}
                </p>
              </div>
              <Button
                label="Open"
                severity="secondary"
                size="small"
                outlined
                :loading="opening === example.name"
                :aria-label="`Open ${example.name} in the editor`"
                class="shrink-0"
                @click="openExample(example.name, example.choices)"
              />
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- What's inside: a plain list, not a card grid. -->
    <section
      class="border-t border-surface-200"
      aria-labelledby="inside"
    >
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
        <h2
          id="inside"
          class="text-3xl font-semibold tracking-[-0.025em]"
        >
          What’s in the editor
        </h2>
        <dl class="grid gap-x-10 sm:grid-cols-2">
          <div
            v-for="item in capabilities"
            :key="item.title"
            class="border-t border-surface-200 py-5"
          >
            <dt class="font-semibold">
              {{ item.title }}
            </dt>
            <dd class="mt-1 text-sm leading-relaxed text-surface-600">
              {{ item.text }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>

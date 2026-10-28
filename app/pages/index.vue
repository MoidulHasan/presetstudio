<script setup lang="ts">
import Aura from '@primeuix/themes/aura'
import { REPO_URL } from '~/utils/site'
import { EXAMPLE_THEMES, SPECIMEN_COMPONENTS, landingTheme, type LandingChoices, type LandingCorners } from '~/utils/landing'
import { listChanges } from '~/utils/theme/changes'
import { CONTRAST_PAIRS, checkContrast } from '~/utils/theme/contrast'
import { generateNuxtSnippets, generatePresetCode, generateVueSnippet } from '~/utils/theme/export'
import { loadBasePreset } from '~/utils/theme/presets'
import { encodeShareToken, shareUrl, startPath } from '~/utils/theme/share'
import { referenceChain, specimenVars, themeResolver, type ChainStep } from '~/utils/theme/specimen'
import type { TokenResolver } from '~/utils/theme/tokens'
import { BASE_PRESETS, BASE_PRESET_LABELS, SHADES, type BasePresetName, type TokenTree } from '~/utils/theme/types'

useSeoMeta({
  title: 'Preset Studio: theme PrimeVue around your brand',
  description: 'A visual theme editor for PrimeVue 4. Pick your brand color, see every component in every state in light and dark, check contrast, and export a preset with only what you changed. Free, open source, runs in your browser.',
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

interface Drawn {
  resolver: TokenResolver
  vars: Record<string, string>
  /** The primary scale, 50 to 950, as the theme resolves it. */
  shades: Array<{ shade: string, value: string }>
}

/** A theme drawn from landing choices, or null until its base preset has loaded. */
function draw(choices: LandingChoices): Drawn | null {
  const base = presets.value[choices.base]
  if (!base) return null
  const resolver = themeResolver(landingTheme(choices), base)
  return {
    resolver,
    vars: specimenVars(resolver, SPECIMEN_COMPONENTS),
    shades: SHADES.map(shade => ({ shade, value: resolver.resolve(`primary-${shade}`)?.value ?? 'transparent' })),
  }
}

// --- The try-it hero ---------------------------------------------------------------------
const choices = ref<LandingChoices>({ base: 'aura', brand: '#0f766e', corners: 'base' })
const theme = computed(() => landingTheme(choices.value))
// The hero's base preset is always loaded: a base is only chosen once it is.
const hero = computed(() => draw(choices.value)!)
const baseLabel = computed(() => BASE_PRESET_LABELS[choices.value.base])
// The logo takes the color picked here.
useLogoColors(() => Object.fromEntries(hero.value.shades.map(band => [band.shade, band.value])))

async function chooseBase(name: BasePresetName) {
  await ensurePreset(name)
  choices.value = { ...choices.value, base: name }
}

const baseOptions = BASE_PRESETS.map(name => ({ value: name, label: BASE_PRESET_LABELS[name] }))
// `radius` draws the option's shape on a 20 × 16px box.
const cornerOptions = computed<Array<{ value: LandingCorners, label: string, radius: string }>>(() => [
  { value: 'none', label: 'Square', radius: '0' },
  { value: 'base', label: `${baseLabel.value} default`, radius: '3px' },
  { value: 'large', label: 'Rounded', radius: '5px' },
  { value: 'xlarge', label: 'Soft', radius: '8px' },
])

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

// --- What you can count on: two of the editor's checks, run on the hero's theme ----------------
const CONTRAST_SHOWN = ['primary', 'text', 'muted', 'highlight', 'primary-ui']
const contrastRows = computed(() => {
  const base = presets.value[choices.value.base]!
  const pairs = CONTRAST_PAIRS.filter(pair => CONTRAST_SHOWN.includes(pair.id))
  const light = checkContrast(hero.value.resolver, pairs)
  const dark = checkContrast(themeResolver(theme.value, base, 'dark'), pairs)
  return light.map((result, index) => ({ pair: result.pair, light: result, dark: dark[index]! }))
})
const ratio = (value: number | null) => (value === null ? 'n/a' : `${value.toFixed(1)}:1`)

const changes = computed(() => listChanges(theme.value))

// --- One color, all the way down -------------------------------------------------------------
// Real reference chains from the hero's theme: switching the base style shows its own wiring.
const CASCADE = [
  { token: 'button-primary-background', label: 'Button background' },
  { token: 'toggleswitch-checked-background', label: 'Switch, on' },
  { token: 'tag-primary-background', label: 'Tag background' },
  { token: 'inputtext-focus-border-color', label: 'Input border, focused' },
] as const

const cascade = computed(() => CASCADE.map((row) => {
  const chain = referenceChain(hero.value.resolver, row.token) ?? []
  const pick = (layer: ChainStep['layer']) => chain.filter(step => step.layer === layer)
  const palette = pick('palette')
  // The primary shade it starts at, marked on a small copy of the hero's bands.
  const shade = palette[0]?.reference.match(/^primary\.(\d+)$/)?.[1] ?? null
  return { ...row, palette, shade, semantic: pick('semantic'), component: pick('component') }
}))

// --- Example themes ------------------------------------------------------------------------
onMounted(() => {
  for (const name of BASE_PRESETS) void ensurePreset(name)
})

const examples = computed(() => EXAMPLE_THEMES.map(example => ({ ...example, drawn: draw(example.choices) })))

async function openExample(name: string, choicesOf: LandingChoices) {
  opening.value = name
  try {
    await navigateTo(shareUrl('', await encodeShareToken(name, landingTheme(choicesOf))))
  }
  finally {
    opening.value = null
  }
}

// --- What you take home: the real files for the choices at the top ---------------------------
const code = computed(() => {
  const base = presets.value[choices.value.base]
  return base ? generatePresetCode(theme.value, base, { name: 'MyPreset' }) : ''
})
const nuxtSetup = (() => {
  const { themeFile, config } = generateNuxtSnippets('MyPreset', 'my-preset')
  return `${themeFile}\n${config}`
})()
const vueSetup = generateVueSnippet('MyPreset', 'my-preset')

// --- Questions: only what the rest of the page doesn't already answer -------------------------
const FAQ = [
  {
    q: 'Which versions does it work with?',
    a: 'PrimeVue 4 in styled mode, with the four presets of @primeuix/themes 2: Aura, Lara, Nora and Material. Unstyled mode isn’t covered.',
  },
  {
    q: 'Why not just ask an AI to write the preset?',
    a: 'For a one-line change, like a new primary color, an AI does fine. Beyond that it works blind: it can’t see the result, it often invents token names that do nothing, and it changes a few tokens where a decision like density needs dozens. Here you see every component and state as you go, every token is checked against PrimeVue’s own engine, and contrast is tested in both modes. The two get along: let your AI wire the exported preset into your app.',
  },
  {
    q: 'Is it made by PrimeTek?',
    a: 'No. Preset Studio is an independent open-source project, not affiliated with or endorsed by PrimeTek. It builds on the MIT-licensed source of PrimeVue 4 and @primeuix/themes.',
  },
] as const
</script>

<template>
  <div class="text-surface-900">
    <!-- Hero, in the content column like the header. On phones the theme shows right after the
         headline; from lg the text sits beside it, centered on its height. -->
    <section class="border-b border-surface-200">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-14 lg:gap-y-10 lg:py-16">
        <div class="flex flex-col gap-5 lg:self-end">
          <p class="text-sm font-medium text-surface-500">
            For PrimeVue 4 · free and open source
          </p>
          <h1 class="max-w-[15ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[3.4rem]">
            Theme PrimeVue around your brand
          </h1>
          <p class="max-w-[46ch] text-lg leading-relaxed text-surface-600">
            Give it one color. See every component in every state, light and dark, and export a
            preset with only what you changed.
          </p>
        </div>

        <!-- The theme, live: the palette it generates under a piece of a real app drawn in it. -->
        <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div class="relative flex min-h-[30rem] min-w-0 items-center justify-center overflow-hidden rounded-3xl px-5 py-12 sm:px-12 lg:min-h-[34rem]">
            <ol
              class="absolute inset-0 flex"
              aria-label="Your primary scale"
            >
              <li
                v-for="(band, index) in hero.shades"
                :key="band.shade"
                class="flex flex-1 items-end justify-center pb-3 text-[0.6875rem] font-medium tabular-nums transition-colors duration-500 ease-out motion-reduce:transition-none"
                :class="index < 5 ? 'text-black/55' : 'text-white/80'"
                :style="{ backgroundColor: band.value, transitionDelay: `${index * 30}ms` }"
                :title="`${band.shade}: ${band.value}`"
              >
                {{ band.shade }}
              </li>
            </ol>
            <LandingSpecimen
              :vars="hero.vars"
              elevated
              phone-compact
              class="relative w-full max-w-md"
            />
          </div>
          <!-- The panel's own switches: the options name themselves (preset names, corner shapes),
               so the labels are their tooltips and accessible names. -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <SelectButton
              v-tooltip.bottom="'Base style'"
              :model-value="choices.base"
              :options="baseOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-label="Base style"
              size="small"
              @update:model-value="chooseBase"
            />
            <SelectButton
              v-model="choices.corners"
              :options="cornerOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-label="Corners"
              size="small"
            >
              <template #option="{ option }">
                <span
                  v-tooltip.bottom="`Corners: ${option.label}`"
                  class="block h-4 w-5 border-2 border-current"
                  :style="{ borderRadius: option.radius }"
                  aria-hidden="true"
                />
                <span class="sr-only">{{ option.label }}</span>
              </template>
            </SelectButton>
          </div>
        </div>

        <div class="flex max-w-xl flex-col gap-8 lg:col-start-1 lg:row-start-2 lg:self-start">
          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-sm font-medium">
              Your brand color
            </legend>
            <EditorBrandColorField v-model="choices.brand" />
          </fieldset>
          <div class="flex flex-wrap items-center gap-3">
            <Button
              label="Open the editor"
              icon="pi pi-arrow-right"
              icon-pos="right"
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
      </div>
    </section>

    <!-- The product itself: the editor on a component, every state, light and dark. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="editor"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2
          id="editor"
          class="mb-10 text-3xl font-semibold tracking-[-0.015em]"
        >
          See it, don’t guess
        </h2>
        <img
          src="/landing/editor.jpg"
          width="1800"
          height="1050"
          alt="The Preset Studio editor on Button: its colors, shape and spacing on the left; every button variant in its default, hover, pressed and focus states on the right, in light and dark side by side."
          loading="lazy"
          decoding="async"
          class="h-auto w-full rounded-xl border border-surface-200 shadow-xl"
        >
        <ul class="mt-10 grid gap-8 sm:grid-cols-3">
          <li class="flex flex-col gap-1">
            <h3 class="font-semibold">
              Every state, no hovering
            </h3>
            <p class="text-sm leading-relaxed text-surface-600">
              Default, hover, pressed and focus side by side, for every variant.
            </p>
          </li>
          <li class="flex flex-col gap-1">
            <h3 class="font-semibold">
              Light and dark together
            </h3>
            <p class="text-sm leading-relaxed text-surface-600">
              Every color is set for both modes. Change it once, see both.
            </p>
          </li>
          <li class="flex flex-col gap-1">
            <h3 class="font-semibold">
              Click to edit
            </h3>
            <p class="text-sm leading-relaxed text-surface-600">
              Click a button, a tag or a field in the preview to open its settings.
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- Why trust the result: two of the editor's checks, live for the theme at the top. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="trust"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2
          id="trust"
          class="mb-12 text-3xl font-semibold tracking-[-0.015em]"
        >
          What you can count on
        </h2>
        <div class="grid gap-12 lg:grid-cols-3 lg:gap-10">
          <div class="flex min-w-0 flex-col gap-4 border-t border-surface-900 pt-5">
            <div class="flex flex-col gap-1">
              <h3 class="font-semibold">
                Correct by construction
              </h3>
              <p class="text-sm leading-relaxed text-surface-600">
                Every token is checked against PrimeVue’s own engine. The export holds only what you
                changed:
              </p>
            </div>
            <ul class="text-sm">
              <li
                v-for="change in changes"
                :key="change.id"
                class="flex items-baseline justify-between gap-3 border-t border-surface-200 py-2"
              >
                <span>{{ change.label }}</span>
                <span class="truncate text-surface-500">{{ change.detail }}</span>
              </li>
            </ul>
          </div>

          <div class="flex min-w-0 flex-col gap-4 border-t border-surface-900 pt-5">
            <div class="flex flex-col gap-1">
              <h3 class="font-semibold">
                Readable in light and dark
              </h3>
              <p class="text-sm leading-relaxed text-surface-600">
                Checked in both modes, with a one-click fix. Try a pale yellow at the top.
              </p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-surface-500">
                  <th class="pb-2 font-medium">
                    Pair
                  </th>
                  <th class="pb-2 text-right font-medium">
                    Light
                  </th>
                  <th class="pb-2 text-right font-medium">
                    Dark
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in contrastRows"
                  :key="row.pair.id"
                  class="border-t border-surface-200"
                >
                  <td class="py-2 pr-2">
                    {{ row.pair.label }}
                  </td>
                  <td
                    v-for="result in [row.light, row.dark]"
                    :key="result === row.light ? 'light' : 'dark'"
                    class="whitespace-nowrap py-2 text-right tabular-nums"
                    :class="result.pass === false ? 'font-semibold text-red-700' : ''"
                  >
                    {{ ratio(result.ratio) }}
                    <i
                      :class="result.pass === false ? 'pi pi-times' : 'pi pi-check text-surface-400'"
                      class="ml-1 text-xs"
                      :aria-label="result.pass === false ? 'fails' : 'passes'"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex min-w-0 flex-col gap-4 border-t border-surface-900 pt-5">
            <h3 class="font-semibold">
              Yours, and private
            </h3>
            <ul class="flex flex-col text-sm">
              <li
                v-for="point in ['Open source under the MIT license', 'Your themes stay in your browser', 'Themes travel as a link or a file', 'A plain definePreset file, nothing extra to install']"
                :key="point"
                class="flex items-start gap-2.5 border-t border-surface-200 py-2"
              >
                <i
                  class="pi pi-check mt-1 text-xs text-surface-500"
                  aria-hidden="true"
                />
                {{ point }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- The three layers of a preset, live for the hero's theme. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="layers"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div class="mb-12 grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
          <h2
            id="layers"
            class="text-3xl font-semibold tracking-[-0.015em]"
          >
            One color, all the way down
          </h2>
          <p class="max-w-[60ch] leading-relaxed text-surface-600">
            Your color replaces the palette and every reference stays, so it lands where
            {{ baseLabel }} wants it.
          </p>
        </div>

        <div
          class="ps-cascade"
          :style="hero.vars"
        >
          <div
            class="hidden gap-6 pb-3 text-sm font-medium text-surface-500 lg:grid lg:grid-cols-[minmax(0,2.4fr)_1rem_minmax(0,3fr)_1rem_minmax(0,3fr)_1rem_minmax(0,2fr)]"
            aria-hidden="true"
          >
            <span>Palette</span>
            <span />
            <span>Semantic</span>
            <span />
            <span>Component</span>
            <span />
            <span>On screen</span>
          </div>
          <ul class="border-t border-surface-200">
            <!-- Phones show the first two chains: enough to see the idea without a long scroll. -->
            <li
              v-for="(row, rowIndex) in cascade"
              :key="row.token"
              class="grid grid-cols-1 items-center gap-3 border-b border-surface-200 py-5 lg:grid-cols-[minmax(0,2.4fr)_1rem_minmax(0,3fr)_1rem_minmax(0,3fr)_1rem_minmax(0,2fr)] lg:gap-6"
              :class="{ 'max-sm:hidden': rowIndex >= 2 }"
              :aria-label="row.label"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="w-24 text-sm text-surface-500 lg:hidden">Palette</span>
                <span
                  v-if="row.shade"
                  class="flex w-full max-w-56 flex-col gap-1.5"
                  :title="`--p-primary-${row.shade}`"
                >
                  <span
                    class="flex h-5 items-stretch"
                    aria-hidden="true"
                  >
                    <span
                      v-for="band in hero.shades"
                      :key="band.shade"
                      class="flex-1 transition-[background-color,transform] duration-500 motion-reduce:transition-none"
                      :class="band.shade === row.shade ? 'relative z-10 scale-y-[1.5] rounded-[3px] ring-2 ring-surface-900 ring-offset-1' : ''"
                      :style="{ backgroundColor: band.value }"
                    />
                  </span>
                  <span class="font-mono text-[0.78rem] text-surface-800">primary.{{ row.shade }}</span>
                </span>
                <template v-else>
                  <LandingTokenChip
                    v-for="step in row.palette"
                    :key="step.name"
                    :step="step"
                  />
                </template>
              </div>
              <span
                class="hidden text-surface-400 lg:block"
                aria-hidden="true"
              ><i class="pi pi-arrow-right text-xs" /></span>
              <div class="flex flex-wrap items-center gap-2">
                <span class="w-24 text-sm text-surface-500 lg:hidden">Semantic</span>
                <template
                  v-for="(step, index) in row.semantic"
                  :key="step.name"
                >
                  <i
                    v-if="index > 0"
                    class="pi pi-arrow-right text-xs text-surface-400"
                    aria-label="then"
                  />
                  <LandingTokenChip :step="step" />
                </template>
                <span
                  v-if="!row.semantic.length"
                  class="text-sm text-surface-500"
                >Uses the shade directly</span>
              </div>
              <span
                class="hidden text-surface-400 lg:block"
                aria-hidden="true"
              ><i class="pi pi-arrow-right text-xs" /></span>
              <div class="flex flex-wrap items-center gap-2">
                <span class="w-24 text-sm text-surface-500 lg:hidden">Component</span>
                <LandingTokenChip
                  v-for="step in row.component"
                  :key="step.name"
                  :step="step"
                />
              </div>
              <span
                class="hidden text-surface-400 lg:block"
                aria-hidden="true"
              ><i class="pi pi-arrow-right text-xs" /></span>
              <div class="flex items-center gap-2">
                <span class="w-24 text-sm text-surface-500 lg:hidden">On screen</span>
                <Button
                  v-if="row.token === 'button-primary-background'"
                  label="Save"
                  tabindex="-1"
                />
                <ToggleSwitch
                  v-else-if="row.token === 'toggleswitch-checked-background'"
                  :model-value="true"
                  aria-label="Example switch, on"
                  :tabindex="-1"
                />
                <Tag
                  v-else-if="row.token === 'tag-primary-background'"
                  value="New"
                />
                <InputText
                  v-else
                  model-value="you@example.com"
                  aria-label="Example input, focused"
                  class="w-full min-w-0"
                  tabindex="-1"
                  readonly
                  :pt="{ root: { style: { borderColor: 'var(--p-inputtext-focus-border-color)' } } }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Example themes, each on its own palette; each opens in the editor as a new theme. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="examples"
    >
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div class="mb-10 flex max-w-2xl flex-col gap-2">
          <h2
            id="examples"
            class="text-3xl font-semibold tracking-[-0.015em]"
          >
            Four themes to start from
          </h2>
          <p class="text-surface-600">
            Open one to keep going from there.
          </p>
        </div>
        <!-- Below md, one row to swipe through instead of four cards stacked. -->
        <ul class="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-x-8 md:gap-y-12 md:overflow-visible md:px-0">
          <li
            v-for="example in examples"
            :key="example.name"
            class="flex w-[85%] min-w-0 shrink-0 snap-start flex-col gap-4 md:w-auto"
          >
            <div class="relative flex min-h-[21rem] items-center justify-center overflow-hidden rounded-2xl bg-surface-100 p-6 sm:p-10">
              <template v-if="example.drawn">
                <div
                  class="absolute inset-0 flex"
                  aria-hidden="true"
                >
                  <span
                    v-for="band in example.drawn.shades"
                    :key="band.shade"
                    class="flex-1"
                    :style="{ backgroundColor: band.value }"
                  />
                </div>
                <LandingSpecimen
                  :vars="example.drawn.vars"
                  compact
                  elevated
                  class="relative w-full max-w-sm"
                />
              </template>
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

    <!-- What leaves the browser: the preset file for these choices, and where it goes. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="export"
    >
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
        <div class="flex flex-col gap-4">
          <h2
            id="export"
            class="text-3xl font-semibold tracking-[-0.015em]"
          >
            What you take home
          </h2>
          <p class="max-w-[46ch] leading-relaxed text-surface-600">
            One <code class="font-mono text-[0.9em]">definePreset</code> file with only what you changed,
            and the setup for Nuxt or Vue. Or send the theme to a teammate as a link.
          </p>
        </div>
        <figure class="flex min-w-0 flex-col gap-2">
          <Tabs value="preset">
            <TabList>
              <Tab value="preset">
                themes/my-preset.ts
              </Tab>
              <Tab value="nuxt">
                Nuxt
              </Tab>
              <Tab value="vue">
                Vue
              </Tab>
            </TabList>
            <TabPanels class="!px-0 !pb-0">
              <TabPanel
                v-for="file in [{ value: 'preset', text: code }, { value: 'nuxt', text: nuxtSetup }, { value: 'vue', text: vueSetup }]"
                :key="file.value"
                :value="file.value"
              >
                <pre class="max-h-[26rem] overflow-auto rounded-2xl border border-surface-200 bg-surface-50 p-5 font-mono text-[0.8125rem] leading-relaxed text-surface-800"><code>{{ file.text }}</code></pre>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <figcaption class="text-sm text-surface-500">
            The export for the choices at the top of this page.
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- What people ask before they try it. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="questions"
    >
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
        <h2
          id="questions"
          class="text-3xl font-semibold tracking-[-0.015em]"
        >
          Questions
        </h2>
        <Accordion
          :value="[]"
          multiple
          class="min-w-0"
        >
          <AccordionPanel
            v-for="item in FAQ"
            :key="item.q"
            :value="item.q"
          >
            <!-- PrimeVue mutes closed headers; questions read as text, not as disabled items. -->
            <AccordionHeader>
              <span class="text-surface-900">{{ item.q }}</span>
            </AccordionHeader>
            <AccordionContent>
              <p class="max-w-[62ch] leading-relaxed text-surface-600">
                {{ item.a }}
              </p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </section>

    <!-- The way out: the page ends where the visitor goes next. -->
    <section aria-label="Open the editor">
      <ol
        class="flex h-2"
        aria-hidden="true"
      >
        <li
          v-for="(band, index) in hero.shades"
          :key="band.shade"
          class="flex-1 transition-colors duration-500 motion-reduce:transition-none"
          :style="{ backgroundColor: band.value, transitionDelay: `${index * 30}ms` }"
        />
      </ol>
      <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p class="max-w-[24ch] text-2xl font-semibold tracking-[-0.012em]">
          Your choices come with you into the editor.
        </p>
        <Button
          label="Open the editor"
          icon="pi pi-arrow-right"
          icon-pos="right"
          size="large"
          :loading="opening === 'hero'"
          class="self-start sm:self-auto"
          @click="continueInEditor"
        />
      </div>
    </section>
  </div>
</template>

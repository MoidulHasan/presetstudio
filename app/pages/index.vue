<script setup lang="ts">
import Aura from '@primeuix/themes/aura'
import { REPO_URL } from '~/utils/site'
import { EXAMPLE_THEMES, SPECIMEN_COMPONENTS, landingTheme, type LandingChoices, type LandingCorners } from '~/utils/landing'
import { generatePresetCode } from '~/utils/theme/export'
import { loadBasePreset } from '~/utils/theme/presets'
import { encodeShareToken, shareUrl, startPath } from '~/utils/theme/share'
import { referenceChain, specimenVars, themeResolver, type ChainStep } from '~/utils/theme/specimen'
import type { TokenResolver } from '~/utils/theme/tokens'
import { BASE_PRESETS, BASE_PRESET_LABELS, SHADES, type BasePresetName, type TokenTree } from '~/utils/theme/types'

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
const choices = ref<LandingChoices>({ base: 'aura', brand: '#0d9488', corners: 'base' })
const theme = computed(() => landingTheme(choices.value))
// The hero's base preset is always loaded: a base is only chosen once it is.
const hero = computed(() => draw(choices.value)!)

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

// What the choices export to: the real file, not a mock.
const code = computed(() => {
  const base = presets.value[choices.value.base]
  return base ? generatePresetCode(theme.value, base, { name: 'MyPreset' }) : ''
})

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
    <!-- Hero: the controls on the left; on the right, the palette they generate, edge to edge,
         under a piece of a real app drawn in it. -->
    <section class="@container grid border-b border-surface-200 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div class="flex min-w-0 flex-col justify-center gap-8 px-4 py-12 sm:px-6 lg:py-16 lg:pl-[max(1.5rem,calc((100cqw_-_72rem)/2_+_1.5rem))] lg:pr-14">
        <div class="flex flex-col gap-5">
          <h1 class="max-w-[15ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[3.4rem]">
            Theme PrimeVue around your brand
          </h1>
          <p class="max-w-[46ch] text-lg leading-relaxed text-surface-600">
            Give it one color. Preset Studio builds the full scale, wires it into every component
            the way your base style intends, and hands you the preset for PrimeVue&nbsp;4.
          </p>
        </div>

        <div class="flex max-w-xl flex-col gap-6">
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

      <div class="relative flex min-h-[34rem] min-w-0 items-center justify-center overflow-hidden px-5 py-14 sm:px-12 lg:min-h-[42rem]">
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
          class="relative w-full max-w-md"
        />
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
            class="text-3xl font-semibold tracking-[-0.025em]"
          >
            One color, all the way down
          </h2>
          <p class="max-w-[60ch] leading-relaxed text-surface-600">
            A PrimeVue preset has three layers: a palette, semantic tokens that give shades a meaning,
            and component tokens. Preset Studio replaces the palette and keeps every reference, so your
            color lands where each base style wants it. Below is how {{ BASE_PRESET_LABELS[choices.base] }}
            wires it; switch the base style above and the shades move.
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
            <li
              v-for="row in cascade"
              :key="row.token"
              class="grid grid-cols-1 items-center gap-3 border-b border-surface-200 py-5 lg:grid-cols-[minmax(0,2.4fr)_1rem_minmax(0,3fr)_1rem_minmax(0,3fr)_1rem_minmax(0,2fr)] lg:gap-6"
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
                  label="Send invite"
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
                  value="Admin"
                />
                <InputText
                  v-else
                  model-value="maya@northwind.io"
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

    <!-- What leaves the browser: the preset file for these choices. -->
    <section
      class="border-b border-surface-200"
      aria-labelledby="export"
    >
      <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14">
        <div class="flex flex-col gap-4">
          <h2
            id="export"
            class="text-3xl font-semibold tracking-[-0.025em]"
          >
            What you take home
          </h2>
          <p class="max-w-[46ch] leading-relaxed text-surface-600">
            One <code class="font-mono text-[0.9em]">definePreset</code> file with only what you changed,
            and the setup steps for Nuxt or Vue. Or send the theme to a teammate as a link.
          </p>
        </div>
        <figure class="flex min-w-0 flex-col gap-2">
          <pre class="max-h-[26rem] overflow-auto rounded-2xl border border-surface-200 bg-surface-50 p-5 font-mono text-[0.8125rem] leading-relaxed text-surface-800"><code>{{ code }}</code></pre>
          <figcaption class="text-sm text-surface-500">
            The export for the choices at the top of this page.
          </figcaption>
        </figure>
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
            v-for="example in examples"
            :key="example.name"
            class="flex min-w-0 flex-col gap-4"
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

    <!-- What's inside: a plain list, not a card grid. -->
    <section aria-labelledby="inside">
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

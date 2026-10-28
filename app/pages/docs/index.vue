<script setup lang="ts">
import { generateNuxtSnippets, generateVueSnippet } from '~/utils/theme/export'

useSeoMeta({
  title: 'Docs · Preset Studio',
  description: 'How to make a PrimeVue 4 preset in Preset Studio and add it to a Nuxt or Vue app: setup, dark mode, sharing and changing a theme later.',
  ogTitle: 'Preset Studio docs',
  ogDescription: 'Make a PrimeVue 4 preset and add it to your Nuxt or Vue app.',
})

// The same snippets the Export drawer gives, for a theme named "My theme".
const nuxt = generateNuxtSnippets('MyThemePreset', 'my-theme')
const vue = generateVueSnippet('MyThemePreset', 'my-theme')

const CONTENTS = [
  { id: 'make', label: 'Make a theme' },
  { id: 'install', label: 'Add it to your app' },
  { id: 'dark', label: 'Dark mode' },
  { id: 'later', label: 'Change it later' },
  { id: 'share', label: 'Share a theme' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'supported', label: 'What’s supported' },
  { id: 'trouble', label: 'If something looks wrong' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 text-surface-900 sm:px-6">
    <h1 class="text-4xl font-semibold tracking-[-0.022em]">
      Docs
    </h1>
    <p class="mt-3 text-lg leading-relaxed text-surface-600">
      Preset Studio turns your choices into a PrimeVue 4 preset. Here’s how to make one and get it into
      your app.
    </p>

    <nav
      aria-label="On this page"
      class="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm"
    >
      <a
        v-for="item in CONTENTS"
        :key="item.id"
        :href="`#${item.id}`"
        class="text-surface-600 underline-offset-4 hover:text-surface-900 hover:underline"
      >{{ item.label }}</a>
    </nav>

    <div class="ps-docs mt-12 flex flex-col gap-14">
      <section aria-labelledby="make">
        <h2 id="make">
          Make a theme
        </h2>
        <ol class="list-decimal">
          <li>
            <NuxtLink to="/editor">Open the editor</NuxtLink>. The setup asks four things: a base style, your brand color, corners and
            neutrals. Or start from one of the examples.
          </li>
          <li>
            Adjust from there. <strong>Colors</strong> and <strong>Shape &amp; spacing</strong> change the whole
            library; <strong>Components</strong> has shared styles (form fields, lists, menus, overlays) and every
            single component, six of them with a visual editor.
          </li>
          <li>
            Check it under <strong>Review</strong>: what you changed, and contrast in light and dark, with a fix
            for each failure.
          </li>
        </ol>
        <p>Everything is saved in your browser as you go; there’s nothing to sign up for.</p>
      </section>

      <section aria-labelledby="install">
        <h2 id="install">
          Add it to your app
        </h2>
        <p>
          <strong>Export</strong> gives you a preset file with only what you changed, on top of your base style,
          and the setup for Nuxt or Vue. Your app needs PrimeVue 4 and @primeuix/themes 2:
        </p>
        <pre><code>npm install primevue@4 @primeuix/themes@2</code></pre>

        <h3>Nuxt</h3>
        <p>Add the PrimeVue module too:</p>
        <pre><code>npm install @primevue/nuxt-module@4</code></pre>
        <p>
          Save the preset as <code>themes/my-theme.ts</code>, wrap it for the module, and point Nuxt at it.
          On Nuxt 4, <code>~</code> means the <code>app/</code> folder, so the files go in
          <code>app/themes/</code>.
        </p>
        <pre><code>{{ nuxt.themeFile }}</code></pre>
        <pre><code>{{ nuxt.config }}</code></pre>
        <p>
          The module needs <code>{ preset, options }</code>. Pointing it at the bare preset gives you no
          theme at all.
        </p>

        <h3>Vue with Vite</h3>
        <p>Save the preset as <code>src/themes/my-theme.ts</code> and register it where you create your app:</p>
        <pre><code>{{ vue }}</code></pre>
      </section>

      <section aria-labelledby="dark">
        <h2 id="dark">
          Dark mode
        </h2>
        <p>
          Every color has a light and a dark value. With <code>darkModeSelector: 'system'</code> your app follows
          the visitor’s system setting. To switch it yourself, use a class instead:
        </p>
        <pre><code>// in the theme options
darkModeSelector: '.app-dark',

// wherever your app toggles it
document.documentElement.classList.toggle('app-dark')</code></pre>
      </section>

      <section aria-labelledby="later">
        <h2 id="later">
          Change it later
        </h2>
        <p>
          Your themes stay in this browser: come back in the same browser and they’re there. To keep a copy or
          move it, use <strong>Export → Share → Download</strong> for the theme file, and open it with
          <strong>Theme menu → Import theme file</strong>. After a change, export again and replace the preset
          file in your app.
        </p>
      </section>

      <section aria-labelledby="share">
        <h2 id="share">
          Share a theme
        </h2>
        <p>
          <strong>Export → Share</strong> gives a link that carries the whole theme inside it; nothing is uploaded.
          Whoever opens it gets their own copy, as a new theme. Some chat apps cut very long links; the theme
          file always works.
        </p>
      </section>

      <section aria-labelledby="privacy">
        <h2 id="privacy">
          Privacy
        </h2>
        <p>
          Your themes never leave your browser. Share links keep the theme after the <code>#</code>, which
          browsers don’t send anywhere. The site counts anonymous page views with Vercel Web Analytics,
          without cookies.
        </p>
      </section>

      <section aria-labelledby="supported">
        <h2 id="supported">
          What’s supported
        </h2>
        <ul class="list-disc">
          <li>PrimeVue 4 in styled mode, with @primeuix/themes 2 and its four base styles: Aura, Lara, Nora and Material.</li>
          <li>All 88 components of those presets, in light and dark.</li>
          <li>Not covered: unstyled mode, and fonts. PrimeVue doesn’t set a font, so your app’s own font applies.</li>
        </ul>
      </section>

      <section aria-labelledby="trouble">
        <h2 id="trouble">
          If something looks wrong
        </h2>
        <ul class="list-disc">
          <li>
            <strong>Nuxt shows the default theme:</strong> check that <code>theme.ts</code> exports
            <code>{ preset, options }</code> and that <code>importTheme</code> points at it (inside
            <code>app/</code> on Nuxt 4).
          </li>
          <li>
            <strong>Dark mode doesn’t switch:</strong> <code>darkModeSelector</code> has to match how your app
            marks dark mode.
          </li>
          <li>
            <strong>Colors differ from the editor:</strong> check that nothing else in your app sets the
            <code>--p-…</code> variables or restyles the components.
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Running text: the page's own styles, kept here since the docs are the only long-form page. */
.ps-docs h2 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin-bottom: 1rem;
  scroll-margin-top: 5rem;
}

.ps-docs h3 {
  font-weight: 600;
  margin: 1.75rem 0 0.5rem;
}

.ps-docs p,
.ps-docs li {
  line-height: 1.7;
  color: var(--p-surface-700);
}

.ps-docs p {
  margin-top: 0.75rem;
}

.ps-docs ol,
.ps-docs ul {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1.25rem;
}

.ps-docs strong {
  font-weight: 600;
  color: var(--p-surface-900);
}

.ps-docs a {
  color: var(--p-surface-900);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ps-docs code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
}

.ps-docs :not(pre) > code {
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: var(--p-surface-100);
}

.ps-docs pre {
  margin-top: 0.75rem;
  overflow-x: auto;
  border: 1px solid var(--p-surface-200);
  border-radius: 12px;
  background: var(--p-surface-50);
  padding: 1rem 1.25rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--p-surface-800);
}
</style>

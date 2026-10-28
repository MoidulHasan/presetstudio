// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { SITE_URL } from './app/utils/site'

export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@primevue/nuxt-module', '@pinia/nuxt'],
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Preset Studio',
      // The social card (public/og.png, 1200 × 630) on every page, the editor's share links included.
      meta: [
        { name: 'description', content: 'Preset Studio: an open-source visual theme (preset) generator for PrimeVue 4.' },
        { property: 'og:site_name', content: 'Preset Studio' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Preset Studio: theme PrimeVue around your brand' },
        { property: 'og:description', content: 'A free, open-source visual theme editor for PrimeVue 4.' },
        { property: 'og:image', content: `${SITE_URL}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Preset Studio: theme PrimeVue around your brand. PrimeVue components in a teal theme over its color scale.' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      // The SVG adapts to a dark browser theme; the ICO is for browsers without SVG icons.
      // The font's Latin file is on every page's first screen, so it loads with the page.
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preload', href: '/fonts/inter-latin.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
      ],
    },
  },

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  routeRules: {
    '/': { prerender: true },
    '/docs/**': { prerender: true },
    '/editor': { ssr: false },
    '/preview': { ssr: false },
  },
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  primevue: {
    // The editor's own fixed theme ({ preset, options }). The theme being designed
    // lives only in the /preview iframe.
    importTheme: { as: 'EditorTheme', from: '~/themes/editor-theme.ts' },
    options: {
      ripple: false,
    },
  },
})

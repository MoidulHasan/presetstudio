// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@primevue/nuxt-module', '@pinia/nuxt'],
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Preset Studio',
      meta: [
        { name: 'description', content: 'Preset Studio: an open-source visual theme (preset) generator for PrimeVue 4.' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
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
    // The editor's own fixed theme. The theme being designed lives only in the /preview iframe.
    importTheme: { as: 'EditorPreset', from: '~/themes/editor-preset.ts' },
    options: {
      ripple: false,
      theme: {
        options: {
          darkModeSelector: '.ps-dark',
          cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
        },
      },
    },
  },
})

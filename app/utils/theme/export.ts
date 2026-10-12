import { buildPresetOverrides } from './build'
import { BASE_PRESET_LABELS, type ThemeState, type TokenTree, type TokenValue } from './types'

const IDENTIFIER_RE = /^[A-Z_$][\w$]*$/i
// Unquoted numeric keys are fine for canonical non-negative integers (50, 100, ...).
const NUMERIC_KEY_RE = /^(?:0|[1-9]\d*)$/

export interface ExportOptions {
  /** Name of the generated preset constant. */
  name?: string
  /** Indentation unit. */
  indent?: string
}

export function quoteString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `'${escaped}'`
}

function formatKey(key: string): string {
  return IDENTIFIER_RE.test(key) || NUMERIC_KEY_RE.test(key) ? key : quoteString(key)
}

function formatValue(value: TokenValue, depth: number, indent: string): string {
  if (typeof value === 'string') return quoteString(value)
  if (typeof value === 'number') return String(value)
  return formatObject(value, depth, indent)
}

/** Formats a token tree as a JS object literal. */
export function formatObject(tree: TokenTree, depth = 0, indent = '  '): string {
  const entries = Object.entries(tree)
  if (!entries.length) return '{}'
  const pad = indent.repeat(depth + 1)
  const lines = entries.map(([key, value]) => `${pad}${formatKey(key)}: ${formatValue(value, depth + 1, indent)}`)
  return `{\n${lines.join(',\n')}\n${indent.repeat(depth)}}`
}

/** Generates a ready-to-paste ES module that defines the preset. */
export function generatePresetCode(state: ThemeState, base: TokenTree, options: ExportOptions = {}): string {
  const name = options.name && IDENTIFIER_RE.test(options.name) ? options.name : 'MyPreset'
  const indent = options.indent ?? '  '
  const baseImport = BASE_PRESET_LABELS[state.basePreset]
  const overrides = buildPresetOverrides(state, base)

  return [
    `import { definePreset } from '@primeuix/themes'`,
    `import ${baseImport} from '@primeuix/themes/${state.basePreset}'`,
    '',
    `const ${name} = definePreset(${baseImport}, ${formatObject(overrides, 0, indent)})`,
    '',
    `export default ${name}`,
    '',
  ].join('\n')
}

// --- Naming and integration snippets ------------------------------------------------

function words(name: string): string[] {
  return name.normalize('NFKD').replace(/[^\w\s-]/g, ' ').split(/[\s_-]+/).filter(Boolean)
}

/** "Brand theme" → "BrandThemePreset". Always a valid identifier. */
export function presetIdentifier(themeName: string): string {
  const pascal = words(themeName).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('').replace(/^\d+/, '')
  if (!pascal) return 'MyPreset'
  return /preset$/i.test(pascal) ? pascal : `${pascal}Preset`
}

/** "Brand theme" → "brand-theme". */
export function presetFileBase(themeName: string): string {
  return words(themeName).map(w => w.toLowerCase()).join('-') || 'my-preset'
}

const DARK_MODE_HINT = `darkModeSelector: 'system', // or a class, e.g. '.app-dark'`

/** Nuxt: importTheme must point at a module exporting `{ preset, options }`. */
export function generateNuxtSnippets(identifier: string, fileBase: string): { themeFile: string, config: string } {
  return {
    themeFile: [
      `// themes/theme.ts`,
      `import ${identifier} from './${fileBase}'`,
      '',
      `// @primevue/nuxt-module expects { preset, options }, not a bare preset.`,
      `export default {`,
      `  preset: ${identifier},`,
      `  options: {`,
      `    ${DARK_MODE_HINT}`,
      `  },`,
      `}`,
      '',
    ].join('\n'),
    config: [
      `// nuxt.config.ts`,
      `export default defineNuxtConfig({`,
      `  modules: ['@primevue/nuxt-module'],`,
      `  primevue: {`,
      `    importTheme: { as: 'AppTheme', from: '~/themes/theme.ts' },`,
      `  },`,
      `})`,
      '',
    ].join('\n'),
  }
}

export function generateVueSnippet(identifier: string, fileBase: string): string {
  return [
    `// main.ts`,
    `import { createApp } from 'vue'`,
    `import PrimeVue from 'primevue/config'`,
    `import App from './App.vue'`,
    `import ${identifier} from './themes/${fileBase}'`,
    '',
    `createApp(App)`,
    `  .use(PrimeVue, {`,
    `    theme: {`,
    `      preset: ${identifier},`,
    `      options: {`,
    `        ${DARK_MODE_HINT}`,
    `      },`,
    `    },`,
    `  })`,
    `  .mount('#app')`,
    '',
  ].join('\n')
}

/** Number of leaf tokens a set of overrides changes. */
export function countTokens(tree: TokenTree): number {
  return Object.values(tree).reduce<number>((n, v) => n + (typeof v === 'object' ? countTokens(v) : 1), 0)
}

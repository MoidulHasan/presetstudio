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

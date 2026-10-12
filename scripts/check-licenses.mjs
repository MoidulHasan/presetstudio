#!/usr/bin/env node
// Walks node_modules and audits every installed package's license.
// - FAILS if any PrimeTek package (primevue, @primevue/*, @primeuix/*, primeicons)
//   is not MIT or is on a major version that went proprietary.
// - Lists every package whose license is not on the permissive allowlist
//   (fails too with --strict).
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const ALLOWED_LICENSES = new Set([
  'MIT',
  'MIT-0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'Unlicense',
])

// Highest major version still published under MIT.
export const PRIMETEK_MAX_MAJOR = {
  'primevue': 4,
  '@primevue/*': 4,
  '@primeuix/themes': 2,
  '@primeuix/styles': 2,
  '@primeuix/styled': 0,
  '@primeuix/utils': 0,
  '@primeuix/forms': 0,
  'primeicons': 7,
}

export function isPrimeTekPackage(name) {
  return name === 'primevue' || name === 'primeicons' || name.startsWith('@primevue/') || name.startsWith('@primeuix/')
}

function maxMajorFor(name) {
  if (name in PRIMETEK_MAX_MAJOR) return PRIMETEK_MAX_MAJOR[name]
  if (name.startsWith('@primevue/')) return PRIMETEK_MAX_MAJOR['@primevue/*']
  return undefined
}

/** Normalizes the `license` / legacy `licenses` fields of a package.json to a string. */
export function getLicense(pkg) {
  const { license, licenses } = pkg
  if (typeof license === 'string') return license.trim()
  if (license && typeof license.type === 'string') return license.type.trim()
  if (Array.isArray(licenses)) {
    const types = licenses.map(l => (typeof l === 'string' ? l : l?.type)).filter(Boolean)
    if (types.length) return types.length === 1 ? types[0] : `(${types.join(' OR ')})`
  }
  return 'UNKNOWN'
}

/**
 * True if a (simple) SPDX expression is satisfiable with allowed licenses:
 * any OR-alternative whose AND-terms are all allowed.
 */
export function isAllowedLicense(expression, allowed = ALLOWED_LICENSES) {
  const expr = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!expr) return false
  return expr
    .split(/ OR /i)
    .some(alt => alt.split(/ AND /i).every(term => allowed.has(term.trim().replace(/\+$/, ''))))
}

/** Returns { errors, warnings } for a list of { name, version, license, path }. */
export function auditPackages(packages) {
  const errors = []
  const warnings = []
  for (const p of packages) {
    if (isPrimeTekPackage(p.name)) {
      if (p.license !== 'MIT') {
        errors.push(`${p.name}@${p.version}: PrimeTek package is "${p.license}", expected MIT (${p.path})`)
      }
      const maxMajor = maxMajorFor(p.name)
      const major = Number.parseInt(String(p.version).split('.')[0], 10)
      if (maxMajor !== undefined && !(major <= maxMajor)) {
        errors.push(`${p.name}@${p.version}: major ${major} is above the last MIT major (${maxMajor}) (${p.path})`)
      }
    }
    else if (!isAllowedLicense(p.license)) {
      warnings.push(`${p.name}@${p.version}: ${p.license}`)
    }
  }
  return { errors, warnings: [...new Set(warnings)].sort() }
}

/** Collects all installed packages (handles npm nested and pnpm .pnpm store layouts). */
export function collectPackages(nodeModulesDir) {
  const seen = new Set()
  const packages = []

  const visitPackage = (dir) => {
    let real
    try {
      real = realpathSync(dir)
    }
    catch {
      return
    }
    if (seen.has(real)) return
    seen.add(real)
    const pkgFile = join(real, 'package.json')
    if (existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
        if (pkg.name && pkg.version) {
          packages.push({ name: pkg.name, version: pkg.version, license: getLicense(pkg), path: real })
        }
      }
      catch {
        // Ignore unreadable package.json files (fixtures etc.).
      }
    }
    const nested = join(real, 'node_modules')
    if (existsSync(nested)) visitNodeModules(nested)
  }

  const visitNodeModules = (dir) => {
    let entries
    try {
      entries = readdirSync(dir)
    }
    catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry)
      if (entry === '.pnpm') {
        // pnpm virtual store: .pnpm/<id>/node_modules/<pkg>
        for (const id of readdirSync(full)) {
          const inner = join(full, id, 'node_modules')
          if (existsSync(inner) && lstatSync(join(full, id)).isDirectory()) visitNodeModules(inner)
        }
      }
      else if (entry.startsWith('.')) {
        continue
      }
      else if (entry.startsWith('@')) {
        for (const scoped of readdirSync(full)) visitPackage(join(full, scoped))
      }
      else {
        visitPackage(full)
      }
    }
  }

  visitNodeModules(nodeModulesDir)
  return packages
}

function main() {
  const strict = process.argv.includes('--strict')
  const nodeModules = resolve(process.cwd(), 'node_modules')
  if (!existsSync(nodeModules)) {
    console.error('node_modules not found. Run `pnpm install` first.')
    process.exit(1)
  }

  const packages = collectPackages(nodeModules)
  const { errors, warnings } = auditPackages(packages)
  const primetek = packages.filter(p => isPrimeTekPackage(p.name))

  console.log(`Scanned ${packages.length} packages.`)
  console.log(`PrimeTek packages (${primetek.length}):`)
  for (const p of [...primetek].sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${p.name}@${p.version}  ${p.license}`)
  }

  if (warnings.length) {
    console.log(`\nPackages with licenses outside the permissive allowlist (${warnings.length}):`)
    for (const w of warnings) console.log(`  ${w}`)
  }

  if (errors.length) {
    console.error(`\n✖ License check FAILED:`)
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }
  if (strict && warnings.length) {
    console.error('\n✖ License check FAILED (--strict): non-allowlisted licenses found.')
    process.exit(1)
  }
  console.log('\n✔ PrimeTek packages are all MIT and on allowed versions.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
}

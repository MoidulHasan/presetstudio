import { describe, expect, it } from 'vitest'
import { auditPackages, getLicense, isAllowedLicense } from './check-licenses.mjs'

const pkg = (name, version, license) => ({ name, version, license, path: `/nm/${name}` })

describe('getLicense', () => {
  it('reads string, object and legacy array forms', () => {
    expect(getLicense({ license: 'MIT' })).toBe('MIT')
    expect(getLicense({ license: { type: 'ISC' } })).toBe('ISC')
    expect(getLicense({ licenses: [{ type: 'MIT' }, { type: 'Apache-2.0' }] })).toBe('(MIT OR Apache-2.0)')
    expect(getLicense({})).toBe('UNKNOWN')
  })
})

describe('isAllowedLicense', () => {
  it('handles OR / AND expressions', () => {
    expect(isAllowedLicense('MIT')).toBe(true)
    expect(isAllowedLicense('(MIT OR GPL-3.0)')).toBe(true)
    expect(isAllowedLicense('MIT AND GPL-3.0')).toBe(false)
    expect(isAllowedLicense('SEE LICENSE IN LICENSE.md')).toBe(false)
    expect(isAllowedLicense('UNKNOWN')).toBe(false)
  })
})

describe('auditPackages', () => {
  it('passes the pinned MIT PrimeTek versions', () => {
    const { errors } = auditPackages([
      pkg('primevue', '4.5.5', 'MIT'),
      pkg('@primevue/core', '4.5.5', 'MIT'),
      pkg('@primeuix/themes', '2.0.3', 'MIT'),
      pkg('@primeuix/styled', '0.7.4', 'MIT'),
      pkg('primeicons', '7.0.0', 'MIT'),
    ])
    expect(errors).toEqual([])
  })

  it('fails on non-MIT or proprietary-major PrimeTek packages', () => {
    const { errors } = auditPackages([
      pkg('primevue', '5.0.2', 'SEE LICENSE IN LICENSE.md'),
      pkg('@primeuix/themes', '3.0.1', 'MIT'),
      pkg('@primeuix/styled', '1.0.0', 'MIT'),
      pkg('primeicons', '8.0.0', 'MIT'),
    ])
    expect(errors).toHaveLength(5)
  })

  it('lists, but does not fail on, non-allowlisted third-party licenses', () => {
    const { errors, warnings } = auditPackages([pkg('foo', '1.0.0', 'MPL-2.0'), pkg('bar', '1.0.0', 'MIT')])
    expect(errors).toEqual([])
    expect(warnings).toEqual(['foo@1.0.0: MPL-2.0'])
  })
})

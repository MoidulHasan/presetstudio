import { describe, expect, it } from 'vitest'
import { forcedFocusCss, forcedFocusSelector, splitSelectorList } from './focus-preview'

describe('splitSelectorList', () => {
  it('splits only on top-level commas', () => {
    expect(splitSelectorList('.a, .b:is(.c, .d), [x="1,2"]')).toEqual(['.a', '.b:is(.c, .d)', '[x="1,2"]'])
  })
})

describe('forcedFocusSelector', () => {
  it('drops the focus pseudo-class and scopes the selector', () => {
    expect(forcedFocusSelector('.p-button:focus-visible', '.s')).toBe('.s .p-button')
    expect(forcedFocusSelector('.p-checkbox-input:focus-visible + .p-checkbox-box', '.s')).toBe('.s .p-checkbox-input + .p-checkbox-box')
    expect(forcedFocusSelector('.p-inputtext:enabled:focus', '.s')).toBe('.s .p-inputtext:enabled')
  })

  it('keeps only the selectors that depend on focus', () => {
    expect(forcedFocusSelector('.a:hover, .a:focus-visible', '.s')).toBe('.s .a')
    expect(forcedFocusSelector('.a:hover', '.s')).toBeNull()
  })

  it('ignores :focus-within and negated focus', () => {
    expect(forcedFocusSelector('.a:focus-within', '.s')).toBeNull()
    expect(forcedFocusSelector('.a:not(:focus)', '.s')).toBeNull()
  })

  it('fills in a bare focus selector', () => {
    expect(forcedFocusSelector(':focus-visible', '.s')).toBe('.s *')
    expect(forcedFocusSelector('.a > :focus-visible', '.s')).toBe('.s .a > *')
    expect(forcedFocusSelector('.a :focus-visible', '.s')).toBe('.s .a *')
  })
})

describe('forcedFocusCss', () => {
  it('copies declarations verbatim and recurses into group rules', () => {
    const css = forcedFocusCss(`
      @layer a, b;
      /* .x:focus { } */
      .a:focus-visible { background: var(--x) no-repeat; }
      .b { color: red; }
      @media (min-width: 1px) { .c:focus { color: blue; } }
      @keyframes k { from { opacity: 0 } }
    `, '.s')
    expect(css).toBe('.s .a { background: var(--x) no-repeat; }\n@media (min-width: 1px) { .s .c { color: blue; } }')
  })
})

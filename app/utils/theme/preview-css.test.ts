import { describe, expect, it } from 'vitest'
import { forcedFocusCss, forcedFocusSelector, forcedStateCss, forcedStateSelector, schemeScopeCss, splitSelectorList } from './preview-css'

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

describe('focus marked by class (Select and co.)', () => {
  it('forces .p-focus on component roots', () => {
    expect(forcedFocusSelector('.p-select:not(.p-disabled).p-focus', '.s')).toBe('.s .p-select:not(.p-disabled)')
    expect(forcedFocusSelector('.p-select.p-variant-filled:not(.p-disabled).p-focus', '.s')).toBe('.s .p-select.p-variant-filled:not(.p-disabled)')
    expect(forcedFocusSelector('.p-autocomplete.p-focus .p-autocomplete-input-multiple:not(.p-disabled)', '.s')).toBe('.s .p-autocomplete .p-autocomplete-input-multiple:not(.p-disabled)')
    expect(forcedFocusSelector('.p-inputchips:not(.p-disabled).p-focus .p-inputchips-input', '.s')).toBe('.s .p-inputchips:not(.p-disabled) .p-inputchips-input')
  })

  it('leaves options and menu items alone', () => {
    expect(forcedFocusSelector('.p-select-option:not(.p-select-option-selected):not(.p-disabled).p-focus', '.s')).toBeNull()
    expect(forcedFocusSelector('.p-listbox:not(.p-disabled) .p-listbox-option.p-listbox-option-selected.p-focus', '.s')).toBeNull()
    expect(forcedFocusSelector('.p-menubar-item.p-focus > .p-menubar-item-content', '.s')).toBeNull()
    expect(forcedFocusSelector('.p-dock-item.p-focus', '.s')).toBeNull()
    expect(forcedFocusSelector('.p-rating-option.p-focus-visible', '.s')).toBeNull()
    // Only the root selector of a list is forced.
    expect(forcedFocusSelector('.p-select.p-focus, .p-select-option.p-focus', '.s')).toBe('.s .p-select')
  })

  it('handles input wrappers, negation and selectors without focus classes', () => {
    expect(forcedFocusSelector('.p-floatlabel:has(.p-inputwrapper-focus) label', '.s')).toBe('.s .p-floatlabel:has(.p-inputwrapper) label')
    expect(forcedFocusSelector('.p-inputgroup .p-component.p-focus ~ label', '.s')).toBe('.s .p-inputgroup .p-component ~ label')
    expect(forcedFocusSelector('.p-select:not(.p-focus)', '.s')).toBeNull()
    expect(forcedFocusSelector('.p-select', '.s')).toBeNull()
    expect(forcedFocusSelector('.a>.b:focus-visible', '.s')).toBe('.s .a>.b')
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

describe('forced hover and active states', () => {
  it('drops only the requested state', () => {
    expect(forcedStateSelector('.p-button:not(:disabled):hover', '.h', 'hover')).toBe('.h .p-button:not(:disabled)')
    expect(forcedStateSelector('.p-button:not(:disabled):active', '.a', 'active')).toBe('.a .p-button:not(:disabled)')
    expect(forcedStateSelector('.p-button:not(:disabled):active', '.h', 'hover')).toBeNull()
    expect(forcedStateSelector('.a:not(:hover)', '.h', 'hover')).toBeNull()
  })

  it('builds CSS for one state', () => {
    expect(forcedStateCss('.a:hover { color: red; } .a:active { color: blue; }', '.h', 'hover')).toBe('.h .a { color: red; }')
  })
})

describe('schemeScopeCss', () => {
  it('re-declares root and dark variables inside a scope', () => {
    const css = schemeScopeCss([
      ':root,:host{--p-a: #fff; --p-b: var(--p-a);}',
      '.ps-dark{--p-a: #000;}',
      '@layer x { :root{--p-c: 1px;} }',
      '.p-button{color: var(--p-a);}',
    ], '.s', 'ps-dark')
    expect(css).toBe('.s { --p-a: #fff; --p-b: var(--p-a); --p-c: 1px; }\n.s.ps-dark { --p-a: #000; }')
  })
})

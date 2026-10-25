/**
 * Brand colors offered in the brand color field (setup, Quick start, landing page). Mid-dark on
 * purpose: a custom color becomes the primary color, so white button text on each of them
 * passes WCAG AA (4.5:1). `brand-suggestions.test.ts` checks it.
 */
export const BRAND_SUGGESTIONS: ReadonlyArray<{ name: string, value: string }> = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Sky', value: '#0369a1' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Emerald', value: '#047857' },
  { name: 'Green', value: '#15803d' },
  { name: 'Amber', value: '#b45309' },
  { name: 'Orange', value: '#c2410c' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Violet', value: '#7c3aed' },
]

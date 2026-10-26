// What a control in the editor points at on the preview's stage. Stage elements are tagged with
// the target a click on them picks ('root:danger:hover', 'cell:border:focus', 'status:warn'); a
// control is tagged with a pattern: a shorter target covers everything under it ('cell:border'
// is every state of that row) and '*' matches any one part ('*:danger' is danger in every style).

/** Lowercase words joined by ':', at most four, '*' as a wildcard in patterns. */
const PATTERN_RE = /^(?:[a-z]+|\*)(?::(?:[a-z]+|\*)){0,3}$/

export function isStagePattern(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 60 && PATTERN_RE.test(value)
}

export function stageTargetMatches(pattern: string, target: string): boolean {
  const want = pattern.split(':')
  const have = target.split(':')
  if (want.length > have.length) return false
  return want.every((part, i) => part === '*' || part === have[i])
}

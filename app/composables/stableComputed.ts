/**
 * A computed that keeps its previous value while the content is the same (by `key`), so what
 * depends on it doesn't update on every edit. Edits rebuild resolvers and counts as new
 * objects even when nothing they feed into changed (a color drag changes no count or flag).
 */
export function stableComputed<T>(get: () => T, key: (value: T) => string = value => JSON.stringify(value)) {
  return computed<T>((previous) => {
    const next = get()
    return previous !== undefined && key(previous) === key(next) ? previous : next
  })
}

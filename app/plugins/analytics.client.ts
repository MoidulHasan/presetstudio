import { injectAnalytics } from '@vercel/analytics/nuxt/runtime'

/**
 * Anonymous page views on the live site (Vercel Web Analytics: no cookies). Share and start
 * links carry a whole theme after the '#', so no event ever includes it. The preview iframe is
 * part of the editor, not a page of its own, so it isn't counted.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.dev || window.self !== window.top) return
  injectAnalytics({
    beforeSend: event => ({ ...event, url: event.url.split('#')[0]! }),
  })
})

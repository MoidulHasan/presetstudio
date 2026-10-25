import { useEditorStore } from '~/stores/editor'

type TokenRequest = NonNullable<ReturnType<typeof useEditorStore>['tokenRequest']>

/**
 * Handles a request to show one token (from search) in the token list that holds it. `holds`
 * picks the request for this list; it's handled once, after the list has rendered.
 */
export function useTokenRequest(holds: (request: TokenRequest) => boolean, show: (request: TokenRequest) => void) {
  const editor = useEditorStore()
  watch(() => editor.tokenRequest, async (request) => {
    if (!request || !holds(request)) return
    editor.tokenRequest = null
    await nextTick()
    show(request)
  }, { immediate: true })
}

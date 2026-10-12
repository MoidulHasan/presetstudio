import type { PreviewCategory } from '~/utils/theme/messages'

// Labels for the component gallery categories (editor toolbar and standalone preview).
export const CATEGORY_META: Record<PreviewCategory, { label: string, icon: string, count: number }> = {
  form: { label: 'Form', icon: 'pi pi-pen-to-square', count: 28 },
  button: { label: 'Button', icon: 'pi pi-stop', count: 4 },
  data: { label: 'Data', icon: 'pi pi-table', count: 10 },
  panel: { label: 'Panel', icon: 'pi pi-window-maximize', count: 10 },
  overlay: { label: 'Overlay', icon: 'pi pi-clone', count: 6 },
  menu: { label: 'Menu', icon: 'pi pi-bars', count: 8 },
  messages: { label: 'Messages', icon: 'pi pi-comment', count: 2 },
  media: { label: 'Media', icon: 'pi pi-image', count: 4 },
  file: { label: 'File', icon: 'pi pi-upload', count: 1 },
  misc: { label: 'Misc', icon: 'pi pi-th-large', count: 14 },
}

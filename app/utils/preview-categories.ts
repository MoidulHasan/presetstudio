import type { GalleryCategory, PreviewCategory } from '~/utils/theme/messages'

type CategoryMeta = { label: string, icon: string, count: number }

// Labels for the component gallery categories (editor toolbar and standalone preview).
const GALLERY_META: Record<GalleryCategory, CategoryMeta> = {
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

export const CATEGORY_META: Record<PreviewCategory, CategoryMeta> = {
  all: {
    label: 'All',
    icon: 'pi pi-list',
    count: Object.values(GALLERY_META).reduce((n, meta) => n + meta.count, 0),
  },
  ...GALLERY_META,
}

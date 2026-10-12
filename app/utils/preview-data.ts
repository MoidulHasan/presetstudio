// Sample data for the preview gallery. Images are generated SVGs (no external assets).

export function sampleImage(hue: number, label: string, width = 600, height = 400): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 38%)"/>`
    + `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`
    + `<circle cx="${width * 0.78}" cy="${height * 0.3}" r="${height * 0.16}" fill="rgba(255,255,255,.35)"/>`
    + `<path d="M0 ${height} L${width * 0.35} ${height * 0.45} L${width * 0.6} ${height * 0.75} L${width * 0.8} ${height * 0.55} L${width} ${height} Z" fill="rgba(0,0,0,.18)"/>`
    + `<text x="24" y="${height - 24}" font-family="system-ui,sans-serif" font-size="${Math.round(height / 12)}" font-weight="600" fill="#fff">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const photos = [
  { title: 'Mountains', hue: 200 },
  { title: 'Desert', hue: 30 },
  { title: 'Forest', hue: 120 },
  { title: 'Ocean', hue: 220 },
  { title: 'Sunset', hue: 340 },
  { title: 'Aurora', hue: 160 },
].map((p, i) => ({
  ...p,
  id: i,
  src: sampleImage(p.hue, p.title),
  thumb: sampleImage(p.hue, '', 120, 80),
}))

export const products = [
  { id: 1, name: 'Desk lamp', category: 'Lighting', price: 49, rating: 4, status: 'In stock' },
  { id: 2, name: 'Walnut shelf', category: 'Furniture', price: 189, rating: 5, status: 'Low stock' },
  { id: 3, name: 'Wool throw', category: 'Textiles', price: 79, rating: 4, status: 'In stock' },
  { id: 4, name: 'Ceramic vase', category: 'Decor', price: 35, rating: 3, status: 'Out of stock' },
  { id: 5, name: 'Lounge chair', category: 'Furniture', price: 420, rating: 5, status: 'In stock' },
  { id: 6, name: 'Wall clock', category: 'Decor', price: 64, rating: 4, status: 'Low stock' },
]

export const stockSeverity: Record<string, string> = { 'In stock': 'success', 'Low stock': 'warn', 'Out of stock': 'danger' }

export const cities = [
  { name: 'Amsterdam', code: 'AMS' },
  { name: 'Berlin', code: 'BER' },
  { name: 'Dhaka', code: 'DAC' },
  { name: 'Lisbon', code: 'LIS' },
  { name: 'Nairobi', code: 'NBO' },
  { name: 'Tokyo', code: 'TYO' },
]

export const countries = [
  {
    name: 'Germany',
    code: 'DE',
    states: [
      { name: 'Bavaria', cities: [{ cname: 'Munich', code: 'MUC' }, { cname: 'Nuremberg', code: 'NUE' }] },
      { name: 'Hamburg', cities: [{ cname: 'Hamburg', code: 'HAM' }] },
    ],
  },
  {
    name: 'Japan',
    code: 'JP',
    states: [
      { name: 'Kanto', cities: [{ cname: 'Tokyo', code: 'TYO' }, { cname: 'Yokohama', code: 'YOK' }] },
      { name: 'Kansai', cities: [{ cname: 'Osaka', code: 'OSA' }, { cname: 'Kyoto', code: 'KYO' }] },
    ],
  },
]

/** Tree nodes for Tree, TreeSelect and TreeTable. */
export const fileNodes = [
  {
    key: '0',
    label: 'Documents',
    icon: 'pi pi-folder',
    data: { name: 'Documents', size: '75kb', type: 'Folder' },
    children: [
      {
        key: '0-0',
        label: 'Work',
        icon: 'pi pi-folder',
        data: { name: 'Work', size: '55kb', type: 'Folder' },
        children: [
          { key: '0-0-0', label: 'Roadmap.pdf', icon: 'pi pi-file-pdf', data: { name: 'Roadmap.pdf', size: '25kb', type: 'PDF' } },
          { key: '0-0-1', label: 'Budget.xlsx', icon: 'pi pi-file-excel', data: { name: 'Budget.xlsx', size: '30kb', type: 'Spreadsheet' } },
        ],
      },
      { key: '0-1', label: 'Notes.txt', icon: 'pi pi-file', data: { name: 'Notes.txt', size: '20kb', type: 'Text' } },
    ],
  },
  {
    key: '1',
    label: 'Pictures',
    icon: 'pi pi-images',
    data: { name: 'Pictures', size: '150kb', type: 'Folder' },
    children: [
      { key: '1-0', label: 'Trip.png', icon: 'pi pi-image', data: { name: 'Trip.png', size: '100kb', type: 'Image' } },
      { key: '1-1', label: 'Logo.svg', icon: 'pi pi-image', data: { name: 'Logo.svg', size: '50kb', type: 'Image' } },
    ],
  },
]

export const orgChart = {
  key: '0',
  label: 'CEO',
  data: 'Ada Lovelace',
  children: [
    { key: '0-0', label: 'CTO', data: 'Alan Turing', children: [{ key: '0-0-0', label: 'Engineering', data: '24 people' }] },
    { key: '0-1', label: 'CFO', data: 'Grace Hopper', children: [{ key: '0-1-0', label: 'Finance', data: '8 people' }] },
  ],
}

export const timelineEvents = [
  { status: 'Ordered', date: 'Oct 10, 10:30', icon: 'pi pi-shopping-cart' },
  { status: 'Processing', date: 'Oct 10, 14:00', icon: 'pi pi-cog' },
  { status: 'Shipped', date: 'Oct 11, 16:15', icon: 'pi pi-send' },
  { status: 'Delivered', date: 'Oct 13, 10:00', icon: 'pi pi-check' },
]

export const menuItems = [
  {
    label: 'File',
    icon: 'pi pi-file',
    items: [
      { label: 'New', icon: 'pi pi-plus' },
      { label: 'Open', icon: 'pi pi-folder-open' },
      { separator: true },
      { label: 'Export', icon: 'pi pi-download', items: [{ label: 'PDF', icon: 'pi pi-file-pdf' }, { label: 'Excel', icon: 'pi pi-file-excel' }] },
    ],
  },
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    items: [
      { label: 'Undo', icon: 'pi pi-undo' },
      { label: 'Copy', icon: 'pi pi-copy' },
      { label: 'Delete', icon: 'pi pi-trash', disabled: true },
    ],
  },
  { label: 'Share', icon: 'pi pi-share-alt' },
]

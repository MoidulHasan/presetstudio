// Framework-free color math: parsing, OKLCH conversion, compositing and WCAG contrast.

export interface Rgba {
  r: number // 0–255
  g: number
  b: number
  a: number // 0–1
}

export interface Oklch {
  l: number // 0–1
  c: number // >= 0
  h: number // degrees
}

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_RE = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i
const COLOR_MIX_RE = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)(?:\s+([\d.]+)%)?\s*,\s*(.+?)(?:\s+([\d.]+)%)?\s*\)$/i

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Parses hex, rgb()/rgba(), `transparent`, `white`/`black` and `color-mix(in srgb, …)`. */
export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase()
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  if (value === 'white') return { r: 255, g: 255, b: 255, a: 1 }
  if (value === 'black') return { r: 0, g: 0, b: 0, a: 1 }

  const hex = HEX_RE.exec(value)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map(c => c + c).join('') : hex
    const n = (i: number) => Number.parseInt(full.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 }
  }

  const rgb = RGB_RE.exec(value)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? Number.parseFloat(rgb[4]) / 100 : Number.parseFloat(rgb[4])
    return { r: clamp(Number(rgb[1]), 0, 255), g: clamp(Number(rgb[2]), 0, 255), b: clamp(Number(rgb[3]), 0, 255), a: clamp(alpha, 0, 1) }
  }

  const mix = COLOR_MIX_RE.exec(value)
  if (mix) {
    const a = parseColor(mix[1]!)
    const b = parseColor(mix[3]!)
    if (!a || !b) return null
    const pa = mix[2] !== undefined ? Number(mix[2]) / 100 : mix[4] !== undefined ? 1 - Number(mix[4]) / 100 : 0.5
    return mixSrgb(a, b, clamp(pa, 0, 1))
  }
  return null
}

/** CSS color-mix(in srgb, a p, b) with premultiplied alpha. */
export function mixSrgb(a: Rgba, b: Rgba, weightA: number): Rgba {
  const wb = 1 - weightA
  const alpha = a.a * weightA + b.a * wb
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const ch = (x: number, y: number) => (x * a.a * weightA + y * b.a * wb) / alpha
  return { r: ch(a.r, b.r), g: ch(a.g, b.g), b: ch(a.b, b.b), a: alpha }
}

/** Alpha-composites `top` over an opaque `bottom`. */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  }
}

/**
 * How a token color looks on screen, as an opaque hex: translucent values (rgba, `color-mix` with
 * `transparent`) are composited over `backdrop` (the surface they usually sit on). `alpha` is the
 * value's own opacity, so callers can tell a solid color from a tint.
 */
export function displayColor(value: string, backdrop: string): { hex: string, alpha: number } | null {
  const color = parseColor(value)
  if (!color) return null
  if (color.a >= 1) return { hex: toHex(color), alpha: 1 }
  const base = parseColor(backdrop)
  const opaqueBase = base && base.a >= 1 ? base : { r: 255, g: 255, b: 255, a: 1 }
  return { hex: toHex(composite(color, opaqueBase)), alpha: color.a }
}

export function toHex({ r, g, b }: Rgba): string {
  const h = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

// --- WCAG 2.x contrast ---------------------------------------------------------

function channelToLinear(v: number): number {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}

/** WCAG contrast ratio (1–21). Translucent colors are composited over `backdrop` first. */
export function contrastRatio(fg: Rgba, bg: Rgba, backdrop: Rgba = { r: 255, g: 255, b: 255, a: 1 }): number {
  const solidBg = bg.a < 1 ? composite(bg, backdrop) : bg
  const solidFg = fg.a < 1 ? composite(fg, solidBg) : fg
  const l1 = relativeLuminance(solidFg)
  const l2 = relativeLuminance(solidBg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// --- OKLCH (Björn Ottosson's OKLab) ---------------------------------------------

function linearToChannel(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return v * 255
}

export function rgbToOklch({ r, g, b }: Rgba): Oklch {
  const lr = channelToLinear(r)
  const lg = channelToLinear(g)
  const lb = channelToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.sqrt(A * A + B * B)
  const h = c < 1e-6 ? 0 : (Math.atan2(B, A) * 180) / Math.PI
  return { l: L, c, h: (h + 360) % 360 }
}

/** OKLCH → linear sRGB (unclamped; may be out of gamut). */
function oklchToLinear({ l: L, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr)
  const B = c * Math.sin(hr)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: [number, number, number]) => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4)

/** OKLCH → sRGB, reducing chroma (binary search) until the color fits the sRGB gamut. */
export function oklchToRgb(color: Oklch): Rgba {
  let lin = oklchToLinear(color)
  if (!inGamut(lin)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid
      else hi = mid
    }
    lin = oklchToLinear({ ...color, c: lo })
  }
  const [r, g, b] = lin.map(v => clamp(linearToChannel(clamp(v, 0, 1)), 0, 255)) as [number, number, number]
  return { r, g, b, a: 1 }
}

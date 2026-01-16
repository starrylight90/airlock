export interface ColorTriple {
  hex: string
  rgb: string
  hsl: string
}

interface Rgb {
  r: number
  g: number
  b: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function parseHex(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) {
    return null
  }

  const full = hex.length === 3 ? hex.split('').map((v) => `${v}${v}`).join('') : hex
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return { r, g, b }
}

function parseRgb(input: string): Rgb | null {
  const match = input
    .trim()
    .match(/^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i)
  if (!match) {
    return null
  }

  const r = clamp(Number(match[1]), 0, 255)
  const g = clamp(Number(match[2]), 0, 255)
  const b = clamp(Number(match[3]), 0, 255)
  return { r, g, b }
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const light = clamp(l, 0, 100) / 100

  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (hue < 60) {
    rPrime = c
    gPrime = x
  } else if (hue < 120) {
    rPrime = x
    gPrime = c
  } else if (hue < 180) {
    gPrime = c
    bPrime = x
  } else if (hue < 240) {
    gPrime = x
    bPrime = c
  } else if (hue < 300) {
    rPrime = x
    bPrime = c
  } else {
    rPrime = c
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

function parseHsl(input: string): Rgb | null {
  const match = input
    .trim()
    .match(/^hsl\(\s*(-?[0-9]{1,3}(?:\.[0-9]+)?)\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)%\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)%\s*\)$/i)
  if (!match) {
    return null
  }

  const h = Number(match[1])
  const s = Number(match[2])
  const l = Number(match[3])
  return hslToRgb(h, s, l)
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`.toUpperCase()
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6
    } else if (max === gn) {
      h = (bn - rn) / delta + 2
    } else {
      h = (rn - gn) / delta + 4
    }
    h *= 60
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h: Math.round((h + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function parseAny(input: string): Rgb | null {
  return parseHex(input) ?? parseRgb(input) ?? parseHsl(input)
}

export function convertColor(input: string): ColorTriple {
  const rgb = parseAny(input)
  if (!rgb) {
    throw new Error('Unsupported color format. Use #hex, rgb(r,g,b), or hsl(h,s%,l%).')
  }

  const hex = rgbToHex(rgb)
  const hsl = rgbToHsl(rgb)

  return {
    hex,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  }
}

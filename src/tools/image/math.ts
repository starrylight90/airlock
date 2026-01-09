export interface CropPercentBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PixelCropBox {
  x: number
  y: number
  width: number
  height: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeCropBox(box: CropPercentBox): CropPercentBox {
  const x = clamp(box.x, 0, 100)
  const y = clamp(box.y, 0, 100)
  const width = clamp(box.width, 1, 100)
  const height = clamp(box.height, 1, 100)

  const constrainedWidth = Math.min(width, 100 - x)
  const constrainedHeight = Math.min(height, 100 - y)

  return {
    x,
    y,
    width: Math.max(1, constrainedWidth),
    height: Math.max(1, constrainedHeight),
  }
}

export function cropPercentToPixels(box: CropPercentBox, imageWidth: number, imageHeight: number): PixelCropBox {
  const normalized = normalizeCropBox(box)
  const x = Math.floor((normalized.x / 100) * imageWidth)
  const y = Math.floor((normalized.y / 100) * imageHeight)
  const width = Math.max(1, Math.floor((normalized.width / 100) * imageWidth))
  const height = Math.max(1, Math.floor((normalized.height / 100) * imageHeight))

  return { x, y, width, height }
}

export function parseGridPreset(preset: string): { cols: number; rows: number } {
  const [colText, rowText] = preset.split('x')
  const cols = Number(colText)
  const rows = Number(rowText)
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
    throw new Error(`Invalid grid preset: ${preset}`)
  }

  return { cols, rows }
}

import { canvasToBlob, loadImageFromFile } from './shared'
import { parseGridPreset } from './math'
import type { ProcessResult } from '../../types'

export async function collageImages(
  files: File[],
  preset: string,
  gap: number,
  backgroundColor: string,
): Promise<ProcessResult> {
  if (files.length === 0) {
    throw new Error('Select one or more images for collage.')
  }

  const images = await Promise.all(files.map((file) => loadImageFromFile(file)))
  const { cols, rows } = parseGridPreset(preset)

  const maxWidth = Math.max(...images.map((img) => img.naturalWidth))
  const maxHeight = Math.max(...images.map((img) => img.naturalHeight))

  const safeGap = Math.max(0, gap)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = cols * maxWidth + (cols + 1) * safeGap
  canvas.height = rows * maxHeight + (rows + 1) * safeGap

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  images.slice(0, cols * rows).forEach((img, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)

    const cellX = safeGap + col * (maxWidth + safeGap)
    const cellY = safeGap + row * (maxHeight + safeGap)

    const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)
    const drawW = Math.round(img.naturalWidth * scale)
    const drawH = Math.round(img.naturalHeight * scale)
    const x = cellX + Math.round((maxWidth - drawW) / 2)
    const y = cellY + Math.round((maxHeight - drawH) / 2)
    ctx.drawImage(img, x, y, drawW, drawH)
  })

  const blob = await canvasToBlob(canvas, 'image/png')
  const originalBytes = files.reduce((sum, file) => sum + file.size, 0)
  return {
    blob,
    outputName: 'airlock-collage.png',
    meta: {
      originalBytes,
      processedBytes: blob.size,
    },
  }
}

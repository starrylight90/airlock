import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export async function compressImage(file: File, quality: number): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  ctx.drawImage(image, 0, 0)

  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'compressed'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export async function convertImage(
  file: File,
  outputType: 'image/png' | 'image/jpeg' | 'image/webp',
  quality: number,
): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  if (outputType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(image, 0, 0)
  const blob = await canvasToBlob(
    canvas,
    outputType,
    outputType === 'image/png' ? undefined : quality,
  )

  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'converted'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

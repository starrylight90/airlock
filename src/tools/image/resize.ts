import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export async function resizeImage(file: File, width: number, height: number): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)

  const sourceType = file.type.startsWith('image/') ? file.type : 'image/png'
  const exportType = sourceType === 'image/gif' ? 'image/png' : sourceType
  const blob = await canvasToBlob(canvas, exportType, exportType === 'image/jpeg' ? 0.92 : undefined)

  return {
    blob,
    outputName: outputNameFor(file, blob.type, `${width}x${height}`),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export async function rotateFlipImage(
  file: File,
  angle: 0 | 90 | 180 | 270,
  flipHorizontal: boolean,
  flipVertical: boolean,
): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const radians = (angle * Math.PI) / 180
  const swapAxis = angle === 90 || angle === 270

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = swapAxis ? image.naturalHeight : image.naturalWidth
  canvas.height = swapAxis ? image.naturalWidth : image.naturalHeight

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(radians)
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const exportType = file.type.startsWith('image/') ? file.type : 'image/png'
  const blob = await canvasToBlob(canvas, exportType, exportType === 'image/jpeg' ? 0.92 : undefined)

  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'rotated'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

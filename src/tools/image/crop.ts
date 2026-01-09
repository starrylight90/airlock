import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import { cropPercentToPixels, type CropPercentBox } from './math'
import type { ProcessResult } from '../../types'

export async function cropImage(file: File, box: CropPercentBox): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const crop = cropPercentToPixels(box, image.naturalWidth, image.naturalHeight)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = crop.width
  canvas.height = crop.height
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  const exportType = file.type.startsWith('image/') ? file.type : 'image/png'
  const blob = await canvasToBlob(canvas, exportType, exportType === 'image/jpeg' ? 0.92 : undefined)

  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'cropped'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

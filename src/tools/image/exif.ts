import exifr from 'exifr'
import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export type ExifResult = Record<string, unknown> | null

export async function readExif(file: File): Promise<ExifResult> {
  try {
    const data = await exifr.parse(file)
    return (data as ExifResult) ?? null
  } catch {
    return null
  }
}

export async function stripExif(file: File): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  ctx.drawImage(image, 0, 0)

  const exportType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(canvas, exportType, exportType === 'image/jpeg' ? 0.92 : undefined)

  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'no-exif'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

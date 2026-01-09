import { canvasToBlob, loadImageFromFile, outputNameFor } from './shared'
import type { ProcessResult } from '../../types'

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

function calculatePosition(
  pos: WatermarkPosition,
  imageWidth: number,
  imageHeight: number,
  markWidth: number,
  markHeight: number,
  padding: number,
): { x: number; y: number } {
  switch (pos) {
    case 'top-left':
      return { x: padding, y: padding + markHeight }
    case 'top-right':
      return { x: imageWidth - markWidth - padding, y: padding + markHeight }
    case 'bottom-left':
      return { x: padding, y: imageHeight - padding }
    case 'bottom-right':
      return { x: imageWidth - markWidth - padding, y: imageHeight - padding }
    default:
      return { x: (imageWidth - markWidth) / 2, y: (imageHeight + markHeight) / 2 }
  }
}

export async function watermarkImage(
  file: File,
  text: string,
  opacity: number,
  position: WatermarkPosition,
  logoFile: File | null,
): Promise<ProcessResult> {
  const image = await loadImageFromFile(file)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported in this browser')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  ctx.drawImage(image, 0, 0)

  ctx.globalAlpha = Math.min(1, Math.max(0.05, opacity))

  if (logoFile) {
    const logo = await loadImageFromFile(logoFile)
    const maxLogoWidth = Math.round(canvas.width * 0.28)
    const scale = Math.min(1, maxLogoWidth / logo.naturalWidth)
    const logoWidth = Math.max(24, Math.round(logo.naturalWidth * scale))
    const logoHeight = Math.max(24, Math.round(logo.naturalHeight * scale))
    const point = calculatePosition(position, canvas.width, canvas.height, logoWidth, logoHeight, 20)
    ctx.drawImage(logo, point.x, point.y - logoHeight, logoWidth, logoHeight)
  } else {
    const markText = text.trim() || 'AIRLOCK'
    const fontSize = Math.max(20, Math.round(canvas.width * 0.04))
    ctx.font = `700 ${fontSize}px Trebuchet MS, sans-serif`
    ctx.fillStyle = '#136f63'
    const markWidth = ctx.measureText(markText).width
    const point = calculatePosition(position, canvas.width, canvas.height, markWidth, fontSize, 20)
    ctx.fillText(markText, point.x, point.y)
  }

  ctx.globalAlpha = 1

  const exportType = file.type.startsWith('image/') ? file.type : 'image/png'
  const blob = await canvasToBlob(canvas, exportType, exportType === 'image/jpeg' ? 0.92 : undefined)
  return {
    blob,
    outputName: outputNameFor(file, blob.type, 'watermarked'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

import { PDFDocument } from 'pdf-lib'
import type { PdfResult } from './common'

export async function imagesToPdf(files: File[]): Promise<PdfResult> {
  if (files.length === 0) {
    throw new Error('Select at least one image file.')
  }

  const pdf = await PDFDocument.create()
  let originalBytes = 0

  for (const file of files) {
    originalBytes += file.size
    const bytes = await file.arrayBuffer()
    let image
    if (file.type === 'image/png') {
      image = await pdf.embedPng(bytes)
    } else {
      image = await pdf.embedJpg(bytes)
    }

    const page = pdf.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  const output = await pdf.save()
  const safeBytes = Uint8Array.from(output)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: 'images-to-pdf.pdf',
    originalBytes,
    processedBytes: blob.size,
  }
}

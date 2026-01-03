import { degrees, rgb, StandardFonts } from 'pdf-lib'
import { readPdf, withPdfExtension, type PdfResult } from './common'

export async function addTextWatermark(file: File, text: string, opacity: number): Promise<PdfResult> {
  if (!text.trim()) {
    throw new Error('Watermark text cannot be empty.')
  }

  const pdf = await readPdf(file)
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(20, Math.floor(Math.min(width, height) * 0.06))
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size,
      font,
      color: rgb(0.1, 0.45, 0.45),
      rotate: degrees(-25),
      opacity,
    })
  }

  const bytes = await pdf.save()
  const safeBytes = Uint8Array.from(bytes)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })

  return {
    blob,
    outputName: withPdfExtension(file.name, 'watermarked'),
    originalBytes: file.size,
    processedBytes: blob.size,
  }
}

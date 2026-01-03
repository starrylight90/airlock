import { degrees } from 'pdf-lib'
import { parsePageSelection, readPdf, withPdfExtension, type PdfResult } from './common'

export async function rotatePdf(file: File, angle: 90 | 180 | 270, pageSpec: string): Promise<PdfResult> {
  const pdf = await readPdf(file)
  const selected = parsePageSelection(pageSpec, pdf.getPageCount())

  for (const pageIndex of selected) {
    const page = pdf.getPage(pageIndex)
    page.setRotation(degrees(angle))
  }

  const bytes = await pdf.save()
  const safeBytes = Uint8Array.from(bytes)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: withPdfExtension(file.name, `rotated-${angle}`),
    originalBytes: file.size,
    processedBytes: blob.size,
  }
}

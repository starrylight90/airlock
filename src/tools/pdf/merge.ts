import { PDFDocument } from 'pdf-lib'
import { withPdfExtension, type PdfResult } from './common'

export async function mergePdfs(files: File[]): Promise<PdfResult> {
  if (files.length < 2) {
    throw new Error('Select at least 2 PDF files to merge.')
  }

  const merged = await PDFDocument.create()
  let originalBytes = 0

  for (const file of files) {
    originalBytes += file.size
    const source = await PDFDocument.load(await file.arrayBuffer())
    const pages = await merged.copyPages(source, source.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }

  const output = await merged.save()
  const safeBytes = Uint8Array.from(output)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: withPdfExtension(files[0].name, 'merged'),
    originalBytes,
    processedBytes: blob.size,
  }
}

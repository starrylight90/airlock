import { PDFDocument } from 'pdf-lib'
import { parsePageSelection, readPdf, withPdfExtension, type PdfResult } from './common'

export async function splitPdf(file: File, rangeSpec: string): Promise<PdfResult> {
  const source = await readPdf(file)
  const pageIndexes = parsePageSelection(rangeSpec, source.getPageCount())
  const out = await PDFDocument.create()
  const pages = await out.copyPages(source, pageIndexes)
  pages.forEach((page) => out.addPage(page))
  const bytes = await out.save()
  const safeBytes = Uint8Array.from(bytes)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: withPdfExtension(file.name, 'split'),
    originalBytes: file.size,
    processedBytes: blob.size,
  }
}

export async function splitPdfPerPage(file: File): Promise<PdfResult> {
  const source = await readPdf(file)
  const out = await PDFDocument.create()
  const firstPage = (await out.copyPages(source, [0]))[0]
  out.addPage(firstPage)
  const bytes = await out.save()
  const safeBytes = Uint8Array.from(bytes)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: withPdfExtension(file.name, 'page-1-preview'),
    originalBytes: file.size,
    processedBytes: blob.size,
  }
}

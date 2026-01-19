import { PDFDocument } from 'pdf-lib'
import { parsePageSelection, readPdf, withPdfExtension, type PdfResult } from './common'

function parseOrder(spec: string, pageCount: number): number[] {
  const selected = parsePageSelection(spec, pageCount)
  if (selected.length !== pageCount) {
    throw new Error('Reorder spec must include all pages exactly once.')
  }
  const unique = new Set(selected)
  if (unique.size !== pageCount) {
    throw new Error('Reorder spec contains duplicate pages.')
  }
  return selected
}

export async function reorderAndDeletePdf(file: File, orderSpec: string, deleteSpec: string): Promise<PdfResult> {
  const source = await readPdf(file)
  const pageCount = source.getPageCount()
  const deletes = new Set(deleteSpec.trim() ? parsePageSelection(deleteSpec, pageCount) : [])

  const kept: number[] = []
  for (let i = 0; i < pageCount; i += 1) {
    if (!deletes.has(i)) {
      kept.push(i)
    }
  }

  const ordered = orderSpec.trim() ? parseOrder(orderSpec, kept.length).map((i) => kept[i]) : kept

  if (ordered.length === 0) {
    throw new Error('Cannot delete all pages from a PDF.')
  }

  const out = await PDFDocument.create()
  const copied = await out.copyPages(source, ordered)
  copied.forEach((page) => out.addPage(page))

  const bytes = await out.save()
  const safeBytes = Uint8Array.from(bytes)
  const blob = new Blob([safeBytes], { type: 'application/pdf' })
  return {
    blob,
    outputName: withPdfExtension(file.name, 'reordered'),
    originalBytes: file.size,
    processedBytes: blob.size,
  }
}

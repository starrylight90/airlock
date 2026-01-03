import { PDFDocument } from 'pdf-lib'

export interface PdfResult {
  blob: Blob
  outputName: string
  originalBytes: number
  processedBytes: number
}

export function withPdfExtension(baseName: string, suffix: string): string {
  const stem = baseName.replace(/\.[^.]+$/, '')
  return `${stem}-${suffix}.pdf`
}

export async function readPdf(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer()
  return PDFDocument.load(bytes)
}

export function parsePageSelection(spec: string, pageCount: number): number[] {
  if (!spec.trim()) {
    return [...Array(pageCount).keys()]
  }

  const indexes = new Set<number>()
  for (const token of spec.split(',')) {
    const part = token.trim()
    if (!part) {
      continue
    }

    if (part.includes('-')) {
      const [a, b] = part.split('-').map((v) => Number(v.trim()))
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1 || a > pageCount || b > pageCount) {
        throw new Error(`Invalid page range: ${part}`)
      }
      const start = Math.min(a, b)
      const end = Math.max(a, b)
      for (let i = start; i <= end; i += 1) {
        indexes.add(i - 1)
      }
      continue
    }

    const n = Number(part)
    if (!Number.isInteger(n) || n < 1 || n > pageCount) {
      throw new Error(`Invalid page index: ${part}`)
    }
    indexes.add(n - 1)
  }

  return [...indexes].sort((x, y) => x - y)
}

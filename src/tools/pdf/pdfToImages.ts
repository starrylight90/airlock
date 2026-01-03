import JSZip from 'jszip'
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api'
import type { PdfResult } from './common'

async function pageToPngBlob(page: PDFPageProxy): Promise<Blob> {
  const viewport = page.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context unavailable for rendering PDF pages.')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to export PNG blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export async function pdfToImages(file: File): Promise<PdfResult> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const documentProxy = await task.promise
  const zip = new JSZip()

  let processedBytes = 0
  const stem = file.name.replace(/\.[^.]+$/, '')

  for (let i = 1; i <= documentProxy.numPages; i += 1) {
    const page = await documentProxy.getPage(i)
    const blob = await pageToPngBlob(page)
    processedBytes += blob.size
    const bytes = new Uint8Array(await blob.arrayBuffer())
    zip.file(`${stem}-page-${i}.png`, bytes)
  }

  const zipBuffer = await zip.generateAsync({ type: 'uint8array' })
  const safeBytes = Uint8Array.from(zipBuffer)
  const outputBlob = new Blob([safeBytes], { type: 'application/zip' })

  return {
    blob: outputBlob,
    outputName: `${stem}-images.zip`,
    originalBytes: file.size,
    processedBytes: processedBytes || outputBlob.size,
  }
}

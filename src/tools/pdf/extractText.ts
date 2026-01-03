export async function extractPdfText(file: File): Promise<{ text: string; fileName: string }> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const documentProxy = await task.promise
  const chunks: string[] = []

  for (let i = 1; i <= documentProxy.numPages; i += 1) {
    const page = await documentProxy.getPage(i)
    const textContent = await page.getTextContent()
    const line = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    chunks.push(`--- Page ${i} ---`)
    chunks.push(line)
    chunks.push('')
  }

  const stem = file.name.replace(/\.[^.]+$/, '')
  return {
    text: chunks.join('\n'),
    fileName: `${stem}-extracted.txt`,
  }
}

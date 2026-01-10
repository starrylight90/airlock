import type { ProcessResult } from '../../types'
import { outputNameFor } from './shared'

export async function removeImageBackground(file: File): Promise<ProcessResult> {
  const bg = await import('@imgly/background-removal')
  const blob = await bg.removeBackground(file, {
    output: {
      format: 'image/png',
      quality: 0.95,
    },
    model: 'isnet',
  })

  return {
    blob,
    outputName: outputNameFor(file, 'image/png', 'bg-removed'),
    meta: {
      originalBytes: file.size,
      processedBytes: blob.size,
    },
  }
}

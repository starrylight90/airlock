import JSZip from 'jszip'
import type { ProcessResult } from '../../types'
import { compressImage } from '../image/compress'
import { convertImage } from '../image/convert'
import { resizeImage } from '../image/resize'
import { type BatchImageMode, summarizeBatch, validateBatchPlan, zipOutputName } from './plan'

export interface BatchImageOptions {
  mode: BatchImageMode
  quality: number
  width: number
  height: number
  format: 'image/png' | 'image/jpeg' | 'image/webp'
}

export interface BatchImageResult {
  result: ProcessResult
  summary: string
}

export async function processImageBatch(
  files: File[],
  options: BatchImageOptions,
): Promise<BatchImageResult> {
  if (files.length === 0) {
    throw new Error('Select one or more images for batch processing.')
  }

  validateBatchPlan({
    mode: options.mode,
    width: options.width,
    height: options.height,
    format: options.format,
  })

  const zip = new JSZip()
  let originalBytes = 0
  let transformedBytes = 0

  for (const file of files) {
    const transformed = await processSingle(file, options)
    zip.file(`outputs/${transformed.outputName}`, transformed.blob)
    originalBytes += transformed.meta.originalBytes
    transformedBytes += transformed.meta.processedBytes
  }

  zip.file(
    'README.txt',
    [
      'Airlock Batch Output',
      `Mode: ${options.mode}`,
      `Files processed: ${files.length}`,
      `Approx transformed bytes: ${transformedBytes}`,
    ].join('\n'),
  )

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        mode: options.mode,
        count: files.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return {
    result: {
      blob,
      outputName: zipOutputName(options.mode),
      meta: {
        originalBytes,
        processedBytes: blob.size,
      },
    },
    summary: summarizeBatch(options.mode, files.length),
  }
}

async function processSingle(file: File, options: BatchImageOptions): Promise<ProcessResult> {
  if (options.mode === 'compress') {
    return await compressImage(file, options.quality)
  }

  if (options.mode === 'resize') {
    return await resizeImage(file, options.width, options.height)
  }

  return await convertImage(file, options.format, options.quality)
}

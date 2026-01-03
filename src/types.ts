export type ToolId =
  | 'compress'
  | 'resize'
  | 'convert'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-rotate'
  | 'pdf-reorder'
  | 'pdf-watermark'
  | 'pdf-protect'
  | 'pdf-to-images'
  | 'images-to-pdf'
  | 'pdf-extract-text'

export interface BaseToolOption {
  label: string
}

export interface CompressOptions extends BaseToolOption {
  quality: number
}

export interface ResizeOptions extends BaseToolOption {
  width: number
  height: number
  lockAspect: boolean
}

export interface ConvertOptions extends BaseToolOption {
  format: 'image/png' | 'image/jpeg' | 'image/webp'
  quality: number
}

export type ToolOptions = CompressOptions | ResizeOptions | ConvertOptions

export interface ProcessResult {
  blob: Blob
  outputName: string
  meta: {
    originalBytes: number
    processedBytes: number
  }
}

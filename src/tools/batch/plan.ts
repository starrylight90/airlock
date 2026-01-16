export type BatchImageMode = 'compress' | 'resize' | 'convert'

export interface BatchPlanInput {
  mode: BatchImageMode
  width: number
  height: number
  format: 'image/png' | 'image/jpeg' | 'image/webp'
}

export function zipOutputName(mode: BatchImageMode): string {
  return `airlock-batch-${mode}.zip`
}

export function validateBatchPlan(input: BatchPlanInput): void {
  if (input.mode === 'resize') {
    if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width < 1 || input.height < 1) {
      throw new Error('Resize batch requires width and height greater than zero.')
    }
  }
}

export function summarizeBatch(mode: BatchImageMode, fileCount: number): string {
  const label =
    mode === 'compress' ? 'compression' : mode === 'resize' ? 'resizing' : 'format conversion'
  return `${fileCount} file(s) processed using batch ${label}.`
}

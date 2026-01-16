import { describe, expect, it } from 'vitest'
import { summarizeBatch, validateBatchPlan, zipOutputName } from './plan'

describe('batch plan helpers', () => {
  it('builds deterministic zip name per mode', () => {
    expect(zipOutputName('compress')).toBe('airlock-batch-compress.zip')
    expect(zipOutputName('resize')).toBe('airlock-batch-resize.zip')
    expect(zipOutputName('convert')).toBe('airlock-batch-convert.zip')
  })

  it('validates resize dimensions', () => {
    expect(() =>
      validateBatchPlan({ mode: 'resize', width: 0, height: 1080, format: 'image/webp' }),
    ).toThrow('Resize batch requires width and height greater than zero.')
  })

  it('summarizes batch mode labels', () => {
    expect(summarizeBatch('compress', 3)).toContain('compression')
    expect(summarizeBatch('resize', 3)).toContain('resizing')
    expect(summarizeBatch('convert', 3)).toContain('format conversion')
  })
})

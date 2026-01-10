import { describe, expect, it } from 'vitest'
import { cropPercentToPixels, normalizeCropBox, parseGridPreset } from './math'

describe('image math helpers', () => {
  it('normalizes crop boxes into bounded percentages', () => {
    const box = normalizeCropBox({ x: 95, y: -10, width: 20, height: 300 })
    expect(box).toEqual({ x: 95, y: 0, width: 5, height: 100 })
  })

  it('converts percent crop to pixel crop', () => {
    const px = cropPercentToPixels({ x: 10, y: 20, width: 50, height: 50 }, 1000, 800)
    expect(px).toEqual({ x: 100, y: 160, width: 500, height: 400 })
  })

  it('parses valid grid presets', () => {
    expect(parseGridPreset('2x3')).toEqual({ cols: 2, rows: 3 })
  })

  it('rejects invalid grid presets', () => {
    expect(() => parseGridPreset('abc')).toThrow('Invalid grid preset: abc')
  })
})

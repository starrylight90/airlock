import { describe, expect, it } from 'vitest'
import { convertColor } from './color'

describe('color conversion', () => {
  it('converts hex to rgb and hsl', () => {
    const result = convertColor('#336699')
    expect(result.rgb).toBe('rgb(51, 102, 153)')
    expect(result.hex).toBe('#336699')
  })

  it('converts rgb to hex', () => {
    const result = convertColor('rgb(255, 0, 0)')
    expect(result.hex).toBe('#FF0000')
    expect(result.hsl).toBe('hsl(0, 100%, 50%)')
  })

  it('rejects unknown formats', () => {
    expect(() => convertColor('red-ish')).toThrow('Unsupported color format')
  })
})

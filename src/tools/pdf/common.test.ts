import { describe, expect, it } from 'vitest'
import { parsePageSelection } from './common'

describe('parsePageSelection', () => {
  it('returns all pages for empty input', () => {
    expect(parsePageSelection('', 4)).toEqual([0, 1, 2, 3])
  })

  it('parses comma and range expressions', () => {
    expect(parsePageSelection('1-3, 5', 6)).toEqual([0, 1, 2, 4])
  })

  it('normalizes reverse range expressions', () => {
    expect(parsePageSelection('4-2', 6)).toEqual([1, 2, 3])
  })

  it('throws on out of bound pages', () => {
    expect(() => parsePageSelection('8', 5)).toThrow('Invalid page index: 8')
  })
})

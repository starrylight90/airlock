import { describe, expect, it } from 'vitest'
import { processJson } from './json'

describe('json utility', () => {
  it('formats JSON with indentation', () => {
    const result = processJson('{"a":1,"b":2}', 'format')
    expect(result.output).toContain('\n  "a": 1')
  })

  it('minifies JSON', () => {
    const result = processJson('{"a": 1, "b": 2}', 'minify')
    expect(result.output).toBe('{"a":1,"b":2}')
  })

  it('validates JSON', () => {
    const result = processJson('{"ok": true}', 'validate')
    expect(result.valid).toBe(true)
    expect(result.output).toBe('Valid JSON')
  })

  it('throws on invalid JSON', () => {
    expect(() => processJson('{oops}', 'format')).toThrow('Invalid JSON')
  })
})

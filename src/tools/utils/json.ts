export type JsonMode = 'format' | 'minify' | 'validate'

export interface JsonResult {
  output: string
  valid: boolean
}

export function processJson(input: string, mode: JsonMode): JsonResult {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Enter JSON input first.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parse error'
    throw new Error(`Invalid JSON: ${message}`, { cause: error })
  }

  if (mode === 'validate') {
    return {
      output: 'Valid JSON',
      valid: true,
    }
  }

  if (mode === 'minify') {
    return {
      output: JSON.stringify(parsed),
      valid: true,
    }
  }

  return {
    output: JSON.stringify(parsed, null, 2),
    valid: true,
  }
}

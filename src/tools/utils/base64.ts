import type { ProcessResult } from '../../types'

export type Base64Mode = 'encode' | 'decode'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function base64ToBytes(base64Input: string): Uint8Array {
  const normalized = base64Input.replace(/\s+/g, '')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function parseDataUrl(input: string): { mime: string; payload: string } | null {
  const match = input.match(/^data:([^;]+);base64,(.+)$/i)
  if (!match) {
    return null
  }
  return {
    mime: match[1],
    payload: match[2],
  }
}

function inferDecodedName(mime: string): string {
  if (mime.startsWith('text/')) {
    return 'airlock-decoded.txt'
  }
  if (mime === 'application/json') {
    return 'airlock-decoded.json'
  }
  if (mime === 'image/png') {
    return 'airlock-decoded.png'
  }
  if (mime === 'image/jpeg') {
    return 'airlock-decoded.jpg'
  }
  return 'airlock-decoded.bin'
}

export async function processBase64(
  mode: Base64Mode,
  inputText: string,
  file: File | null,
): Promise<{ result: ProcessResult; textPreview: string | null }> {
  if (mode === 'encode') {
    let bytes: Uint8Array
    let label: string

    if (file) {
      bytes = new Uint8Array(await file.arrayBuffer())
      label = file.name
    } else {
      if (!inputText) {
        throw new Error('Enter text to encode or choose a file.')
      }
      bytes = new TextEncoder().encode(inputText)
      label = 'text'
    }

    const encoded = bytesToBase64(bytes)
    const blob = new Blob([encoded], { type: 'text/plain;charset=utf-8' })

    return {
      result: {
        blob,
        outputName: `airlock-${label.replace(/\.[^.]+$/, '')}-base64.txt`,
        meta: {
          originalBytes: bytes.byteLength,
          processedBytes: blob.size,
        },
      },
      textPreview: encoded,
    }
  }

  if (!inputText.trim()) {
    throw new Error('Paste Base64 input to decode.')
  }

  const parsed = parseDataUrl(inputText.trim())
  const mime = parsed?.mime ?? 'application/octet-stream'
  const bytes = base64ToBytes(parsed?.payload ?? inputText)
  const blob = new Blob([new Uint8Array(bytes)], { type: mime })

  let textPreview: string | null = null
  if (mime.startsWith('text/') || mime === 'application/json') {
    textPreview = new TextDecoder().decode(bytes)
  }

  return {
    result: {
      blob,
      outputName: inferDecodedName(mime),
      meta: {
        originalBytes: new TextEncoder().encode(inputText).byteLength,
        processedBytes: blob.size,
      },
    },
    textPreview,
  }
}

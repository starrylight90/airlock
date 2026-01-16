import type { ProcessResult } from '../../types'

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateHash(
  algorithm: HashAlgorithm,
  textInput: string,
  file: File | null,
): Promise<{ result: ProcessResult; digest: string }> {
  let bytes: Uint8Array

  if (file) {
    bytes = new Uint8Array(await file.arrayBuffer())
  } else {
    if (!textInput.trim()) {
      throw new Error('Enter text or choose a file for hashing.')
    }
    bytes = new TextEncoder().encode(textInput)
  }

  const digestBuffer = await crypto.subtle.digest(algorithm, new Uint8Array(bytes).buffer)
  const digest = bytesToHex(new Uint8Array(digestBuffer))
  const payload = `${algorithm}: ${digest}`
  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' })

  return {
    result: {
      blob,
      outputName: `airlock-${algorithm.toLowerCase()}-hash.txt`,
      meta: {
        originalBytes: bytes.byteLength,
        processedBytes: blob.size,
      },
    },
    digest,
  }
}

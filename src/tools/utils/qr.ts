import QRCode from 'qrcode'
import type { ProcessResult } from '../../types'

export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H'

export async function generateQrPng(
  text: string,
  size: number,
  errorLevel: QrErrorLevel,
): Promise<ProcessResult> {
  const payload = text.trim()
  if (!payload) {
    throw new Error('Enter text or a URL for QR generation.')
  }

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: errorLevel,
    margin: 1,
    width: Math.max(128, Math.min(2048, Math.round(size))),
  })

  const response = await fetch(dataUrl)
  const blob = await response.blob()

  return {
    blob,
    outputName: 'airlock-qr.png',
    meta: {
      originalBytes: new TextEncoder().encode(payload).byteLength,
      processedBytes: blob.size,
    },
  }
}

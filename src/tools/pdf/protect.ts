import type { PdfResult } from './common'

export async function validateProtectIntent(_file: File, password: string): Promise<PdfResult> {
  if (password.trim().length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  throw new Error(
    'Password protect/unlock is intentionally disabled in Phase 2. Browser-only cryptography for robust PDF encryption will be introduced in a later phase.',
  )
}

import { describe, expect, it } from 'vitest'

import { rewriteAssetPaths, sanitizeInlineModule, toTitleBanner } from './build-offline-html.mjs'
import { buildReleaseNotes } from './release-artifacts.mjs'

describe('offline packaging helpers', () => {
  it('rewrites absolute and root-relative asset paths', () => {
    const input = [
      '<script src="/assets/index.js"></script>',
      'import "./chunk.js"',
      'url(/assets/index.css)',
    ].join('\n')

    const output = rewriteAssetPaths(input)

    expect(output).toContain('src="./assets/index.js"')
    expect(output).toContain('import "./assets/chunk.js"')
    expect(output).toContain('url(./assets/index.css)')
  })

  it('escapes closing script tags inside inlined modules', () => {
    const input = 'const x = "</script><script>alert(1)</script>"'
    const output = sanitizeInlineModule(input)

    expect(output).not.toContain('</script>')
    expect(output).toContain('<\\/script>')
  })

  it('includes an offline mode banner message', () => {
    const banner = toTitleBanner()
    expect(banner).toContain('Offline Artifact Mode')
  })
})

describe('release notes helper', () => {
  it('contains hosted and offline artifact docs', () => {
    const notes = buildReleaseNotes()

    expect(notes).toContain('## hosted/')
    expect(notes).toContain('## offline/')
    expect(notes).toContain('offline.html')
  })
})

import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const indexPath = path.join(distDir, 'index.html')
const offlinePath = path.join(distDir, 'offline.html')

async function fileText(relativePath) {
  const full = path.join(distDir, relativePath.replace(/^\//, ''))
  return await fs.readFile(full, 'utf8')
}

function rewriteAssetPaths(content) {
  return content
    .replace(/(["'`])\/assets\//g, '$1./assets/')
    .replace(/(["'`])\.\/(?!assets\/)([^"'`]+?\.(?:js|mjs|css|wasm))\1/g, '$1./assets/$2$1')
    .replace(/url\(\/assets\//g, 'url(./assets/')
}

function sanitizeInlineModule(code) {
  return rewriteAssetPaths(code).replace(/<\/script/gi, '<\\/script')
}

function toTitleBanner() {
  return [
    '<section style="margin:0 0 12px;padding:10px 12px;border:1px solid #e7d4bf;border-radius:10px;background:#fff5e7;font:600 13px/1.4 Trebuchet MS, sans-serif;color:#102a43;">',
    'Offline Artifact Mode: this HTML is self-contained for core shell and tool logic. Some advanced features may still depend on additional bundled assets in the same folder.',
    '</section>',
  ].join('')
}

async function run() {
  let html = await fs.readFile(indexPath, 'utf8')

  html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')

  const cssLinks = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
  for (const match of cssLinks) {
    const href = match[1]
    const css = rewriteAssetPaths(await fileText(href))
    html = html.replace(match[0], () => `<style>\n${css}\n</style>`)
  }

  const moduleScripts = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)]
  for (const match of moduleScripts) {
    const src = match[1]
    const code = sanitizeInlineModule(await fileText(src))
    html = html.replace(match[0], () => `<script type="module">\n${code}\n</script>`)
  }

  html = html.replace('<main id="root"></main>', `<main id="root"></main>${toTitleBanner()}`)

  await fs.writeFile(offlinePath, html, 'utf8')
  console.log(`Created offline artifact: ${offlinePath}`)
}

run().catch((error) => {
  console.error('Failed to build offline html artifact.')
  console.error(error)
  process.exitCode = 1
})

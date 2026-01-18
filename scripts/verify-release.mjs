import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const releaseDir = path.join(root, 'release')

async function assertExists(filePath) {
  try {
    await fs.access(filePath)
  } catch {
    throw new Error(`Missing required artifact: ${filePath}`)
  }
}

async function assertNoAbsoluteAssetRefs(offlineHtmlPath) {
  const html = await fs.readFile(offlineHtmlPath, 'utf8')

  const hasAbsoluteAssetRef =
    html.includes('"/assets/') ||
    html.includes("'/assets/") ||
    html.includes('url(/assets/')

  if (hasAbsoluteAssetRef) {
    throw new Error('Offline HTML contains absolute /assets/ references; expected relative ./assets/ paths.')
  }

  if (/<link[^>]*rel="modulepreload"/i.test(html)) {
    throw new Error('Offline HTML still contains modulepreload links.')
  }
}

async function run() {
  const required = [
    path.join(distDir, 'offline.html'),
    path.join(releaseDir, 'README.txt'),
    path.join(releaseDir, 'hosted', 'index.html'),
    path.join(releaseDir, 'offline', 'airlock-offline.html'),
    path.join(releaseDir, 'offline', 'assets'),
  ]

  for (const item of required) {
    await assertExists(item)
  }

  await assertNoAbsoluteAssetRefs(path.join(releaseDir, 'offline', 'airlock-offline.html'))

  console.log('Release verification passed.')
}

run().catch((error) => {
  console.error('Release verification failed.')
  console.error(error)
  process.exitCode = 1
})

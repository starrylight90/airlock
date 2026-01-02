const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  try {
    return await loadImageFromUrl(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = url
  })
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not export image'))
          return
        }
        resolve(blob)
      },
      type,
      quality,
    )
  })
}

export function outputNameFor(file: File, mimeType: string, suffix: string): string {
  const extension = MIME_EXTENSION_MAP[mimeType] ?? 'bin'
  const stem = file.name.replace(/\.[^.]+$/, '')
  return `${stem}-${suffix}.${extension}`
}

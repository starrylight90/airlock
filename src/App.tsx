import { useEffect, useMemo, useState } from 'react'
import { DownloadResult } from './shell/DownloadResult'
import { FileDropZone } from './shell/FileDropZone'
import { PrivacyBanner } from './shell/PrivacyBanner'
import { ToolLayout } from './shell/ToolLayout'
import { compressImage } from './tools/image/compress'
import { convertImage } from './tools/image/convert'
import { resizeImage } from './tools/image/resize'
import type { ToolId } from './types'

const TOOL_OPTIONS = [
  { id: 'compress', label: 'Image Compressor', subtitle: 'Shrink file size with quality control.' },
  { id: 'resize', label: 'Image Resizer', subtitle: 'Resize with aspect lock for precise dimensions.' },
  { id: 'convert', label: 'Format Converter', subtitle: 'Convert PNG, JPG, and WebP in-browser.' },
] as const

function App() {
  const [tool, setTool] = useState<ToolId>('compress')
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(0.78)
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp')
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [lockAspect, setLockAspect] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState<string | null>(null)
  const [originalBytes, setOriginalBytes] = useState<number | null>(null)
  const [processedBytes, setProcessedBytes] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl)
      }
    }
  }, [previewUrl, outputUrl])

  function resetOutputs() {
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl)
    }
    setOutputUrl(null)
    setOutputName(null)
    setOriginalBytes(null)
    setProcessedBytes(null)
    setError(null)
  }

  function onFileSelected(nextFile: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const preview = URL.createObjectURL(nextFile)
    setPreviewUrl(preview)
    setFile(nextFile)
    resetOutputs()

    const image = new Image()
    image.onload = () => {
      setWidth(image.naturalWidth)
      setHeight(image.naturalHeight)
      setAspectRatio(image.naturalWidth / image.naturalHeight)
    }
    image.src = preview
  }

  async function processCurrentFile() {
    if (!file) {
      setError('Pick an image first.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      let result
      if (tool === 'compress') {
        result = await compressImage(file, quality)
      } else if (tool === 'resize') {
        result = await resizeImage(file, width, height)
      } else {
        result = await convertImage(file, format, quality)
      }

      if (outputUrl) {
        URL.revokeObjectURL(outputUrl)
      }

      const nextOutputUrl = URL.createObjectURL(result.blob)
      setOutputUrl(nextOutputUrl)
      setOutputName(result.outputName)
      setOriginalBytes(result.meta.originalBytes)
      setProcessedBytes(result.meta.processedBytes)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Processing failed')
    } finally {
      setBusy(false)
    }
  }

  function onWidthChange(nextWidth: number) {
    setWidth(nextWidth)
    if (lockAspect) {
      setHeight(Math.max(1, Math.round(nextWidth / aspectRatio)))
    }
  }

  function onHeightChange(nextHeight: number) {
    setHeight(nextHeight)
    if (lockAspect) {
      setWidth(Math.max(1, Math.round(nextHeight * aspectRatio)))
    }
  }

  const activeTool = useMemo(() => TOOL_OPTIONS.find((entry) => entry.id === tool)!, [tool])

  return (
    <div className="app-frame">
      <div className="ambient ambient-a" aria-hidden="true"></div>
      <div className="ambient ambient-b" aria-hidden="true"></div>

      <header className="top-bar">
        <div className="brand">
          <strong>Airlock</strong>
          <span>Local-First File Utilities</span>
        </div>
        <nav className="tool-switcher" aria-label="Tool selector">
          {TOOL_OPTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === tool ? 'active' : ''}
              onClick={() => {
                setTool(entry.id)
                resetOutputs()
              }}
            >
              {entry.label}
            </button>
          ))}
        </nav>
      </header>

      <PrivacyBanner networkIdleNote="Open DevTools Network tab while processing: requests stay at zero." />

      <ToolLayout
        title={activeTool.label}
        subtitle={activeTool.subtitle}
        controls={
          <div className="controls-stack">
            {tool === 'compress' ? (
              <label className="control">
                <span>Compression quality: {Math.round(quality * 100)}%</span>
                <input
                  type="range"
                  min="0.3"
                  max="0.98"
                  step="0.01"
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                />
              </label>
            ) : null}

            {tool === 'resize' ? (
              <>
                <label className="control-inline">
                  <span>Width</span>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={width}
                    onChange={(event) => onWidthChange(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
                <label className="control-inline">
                  <span>Height</span>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={height}
                    onChange={(event) => onHeightChange(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(event) => setLockAspect(event.target.checked)}
                  />
                  <span>Keep aspect ratio</span>
                </label>
              </>
            ) : null}

            {tool === 'convert' ? (
              <>
                <label className="control-inline">
                  <span>Output format</span>
                  <select
                    value={format}
                    onChange={(event) =>
                      setFormat(event.target.value as 'image/png' | 'image/jpeg' | 'image/webp')
                    }
                  >
                    <option value="image/webp">WebP</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                  </select>
                </label>
                {format !== 'image/png' ? (
                  <label className="control">
                    <span>Encoding quality: {Math.round(quality * 100)}%</span>
                    <input
                      type="range"
                      min="0.3"
                      max="0.98"
                      step="0.01"
                      value={quality}
                      onChange={(event) => setQuality(Number(event.target.value))}
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            <button className="process-button" type="button" disabled={busy || !file} onClick={processCurrentFile}>
              {busy ? 'Processing...' : 'Process File'}
            </button>
            {error ? <p className="error-copy">{error}</p> : null}
          </div>
        }
        dropZone={
          <>
            <FileDropZone acceptedMimePrefix="image/" file={file} onFileSelected={onFileSelected} />
            {previewUrl ? (
              <figure className="preview-card">
                <img src={previewUrl} alt="Selected input preview" />
                <figcaption>Input preview</figcaption>
              </figure>
            ) : null}
          </>
        }
        result={
          <>
            <DownloadResult
              outputUrl={outputUrl}
              outputName={outputName}
              originalBytes={originalBytes}
              processedBytes={processedBytes}
            />
            {outputUrl ? (
              <figure className="preview-card">
                <img src={outputUrl} alt="Processed output preview" />
                <figcaption>Processed preview</figcaption>
              </figure>
            ) : null}
          </>
        }
      />
    </div>
  )
}

export default App

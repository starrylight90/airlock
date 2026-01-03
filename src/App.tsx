import { useEffect, useMemo, useState } from 'react'
import { DownloadResult } from './shell/DownloadResult'
import { FileDropZone } from './shell/FileDropZone'
import { PrivacyBanner } from './shell/PrivacyBanner'
import { ToolLayout } from './shell/ToolLayout'
import { compressImage } from './tools/image/compress'
import { convertImage } from './tools/image/convert'
import { resizeImage } from './tools/image/resize'
import type { ToolId } from './types'

const IMAGE_TOOL_OPTIONS = [
  { id: 'compress', label: 'Image Compressor', subtitle: 'Shrink file size with quality control.' },
  { id: 'resize', label: 'Image Resizer', subtitle: 'Resize with aspect lock for precise dimensions.' },
  { id: 'convert', label: 'Format Converter', subtitle: 'Convert PNG, JPG, and WebP in-browser.' },
] as const

const PDF_TOOL_OPTIONS = [
  { id: 'pdf-merge', label: 'PDF Merge', subtitle: 'Combine multiple PDFs into one final document.' },
  { id: 'pdf-split', label: 'PDF Split', subtitle: 'Extract page ranges or preview one page split.' },
  { id: 'pdf-rotate', label: 'PDF Rotate', subtitle: 'Rotate selected pages using browser-only processing.' },
  { id: 'pdf-reorder', label: 'PDF Reorder/Delete', subtitle: 'Rebuild PDF page order and remove unwanted pages.' },
  { id: 'pdf-watermark', label: 'PDF Watermark', subtitle: 'Overlay text watermark across every page.' },
  { id: 'pdf-protect', label: 'PDF Password (Preview)', subtitle: 'Validation flow with transparent Phase 2 limitation.' },
  { id: 'pdf-to-images', label: 'PDF to Images', subtitle: 'Export each page to PNG and download as ZIP.' },
  { id: 'images-to-pdf', label: 'Images to PDF', subtitle: 'Combine image files into one PDF locally.' },
  { id: 'pdf-extract-text', label: 'Extract Text', subtitle: 'Pull readable text into a downloadable TXT file.' },
] as const

const TOOL_OPTIONS = [...IMAGE_TOOL_OPTIONS, ...PDF_TOOL_OPTIONS]

type ToolOption = (typeof TOOL_OPTIONS)[number]

function isImageTool(tool: ToolId): boolean {
  return tool === 'compress' || tool === 'resize' || tool === 'convert'
}

function App() {
  const [tool, setTool] = useState<ToolId>('compress')
  const [file, setFile] = useState<File | null>(null)
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(0.78)
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp')
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [lockAspect, setLockAspect] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [splitMode, setSplitMode] = useState<'range' | 'single-page-preview'>('range')
  const [pageSpec, setPageSpec] = useState('1-2')
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90)
  const [deleteSpec, setDeleteSpec] = useState('')
  const [orderSpec, setOrderSpec] = useState('')
  const [watermarkText, setWatermarkText] = useState('AIRLOCK')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.28)
  const [password, setPassword] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState<string | null>(null)
  const [textOutput, setTextOutput] = useState<string | null>(null)
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
    setTextOutput(null)
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
    setMultiFiles([])
    resetOutputs()

    const image = new Image()
    image.onload = () => {
      setWidth(image.naturalWidth)
      setHeight(image.naturalHeight)
      setAspectRatio(image.naturalWidth / image.naturalHeight)
    }
    image.src = preview
  }

  function onMultiFilesSelected(nextFiles: FileList | null) {
    if (!nextFiles) {
      return
    }
    const selected = Array.from(nextFiles)
    setMultiFiles(selected)
    setFile(selected[0] ?? null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    resetOutputs()
  }

  async function processCurrentFile() {
    setBusy(true)
    setError(null)

    try {
      let result: { blob: Blob; outputName: string; meta: { originalBytes: number; processedBytes: number } } | null =
        null

      if (tool === 'compress') {
        if (!file) throw new Error('Pick an image first.')
        result = await compressImage(file, quality)
      } else if (tool === 'resize') {
        if (!file) throw new Error('Pick an image first.')
        result = await resizeImage(file, width, height)
      } else if (tool === 'convert') {
        if (!file) throw new Error('Pick an image first.')
        result = await convertImage(file, format, quality)
      } else if (tool === 'pdf-merge') {
        const { mergePdfs } = await import('./tools/pdf/merge')
        const mergeResult = await mergePdfs(multiFiles)
        result = {
          blob: mergeResult.blob,
          outputName: mergeResult.outputName,
          meta: {
            originalBytes: mergeResult.originalBytes,
            processedBytes: mergeResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-split') {
        const { splitPdf, splitPdfPerPage } = await import('./tools/pdf/split')
        if (!file) throw new Error('Pick a PDF first.')
        const splitResult = splitMode === 'range' ? await splitPdf(file, pageSpec) : await splitPdfPerPage(file)
        result = {
          blob: splitResult.blob,
          outputName: splitResult.outputName,
          meta: {
            originalBytes: splitResult.originalBytes,
            processedBytes: splitResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-rotate') {
        const { rotatePdf } = await import('./tools/pdf/rotate')
        if (!file) throw new Error('Pick a PDF first.')
        const rotateResult = await rotatePdf(file, rotateAngle, pageSpec)
        result = {
          blob: rotateResult.blob,
          outputName: rotateResult.outputName,
          meta: {
            originalBytes: rotateResult.originalBytes,
            processedBytes: rotateResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-reorder') {
        const { reorderAndDeletePdf } = await import('./tools/pdf/reorderDelete')
        if (!file) throw new Error('Pick a PDF first.')
        const reorderResult = await reorderAndDeletePdf(file, orderSpec, deleteSpec)
        result = {
          blob: reorderResult.blob,
          outputName: reorderResult.outputName,
          meta: {
            originalBytes: reorderResult.originalBytes,
            processedBytes: reorderResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-watermark') {
        const { addTextWatermark } = await import('./tools/pdf/watermark')
        if (!file) throw new Error('Pick a PDF first.')
        const watermarkResult = await addTextWatermark(file, watermarkText, watermarkOpacity)
        result = {
          blob: watermarkResult.blob,
          outputName: watermarkResult.outputName,
          meta: {
            originalBytes: watermarkResult.originalBytes,
            processedBytes: watermarkResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-protect') {
        const { validateProtectIntent } = await import('./tools/pdf/protect')
        if (!file) throw new Error('Pick a PDF first.')
        const protectResult = await validateProtectIntent(file, password)
        result = {
          blob: protectResult.blob,
          outputName: protectResult.outputName,
          meta: {
            originalBytes: protectResult.originalBytes,
            processedBytes: protectResult.processedBytes,
          },
        }
      } else if (tool === 'pdf-to-images') {
        const { pdfToImages } = await import('./tools/pdf/pdfToImages')
        if (!file) throw new Error('Pick a PDF first.')
        const convertResult = await pdfToImages(file)
        result = {
          blob: convertResult.blob,
          outputName: convertResult.outputName,
          meta: {
            originalBytes: convertResult.originalBytes,
            processedBytes: convertResult.processedBytes,
          },
        }
      } else if (tool === 'images-to-pdf') {
        const { imagesToPdf } = await import('./tools/pdf/imagesToPdf')
        const imagePdf = await imagesToPdf(multiFiles)
        result = {
          blob: imagePdf.blob,
          outputName: imagePdf.outputName,
          meta: {
            originalBytes: imagePdf.originalBytes,
            processedBytes: imagePdf.processedBytes,
          },
        }
      } else if (tool === 'pdf-extract-text') {
        const { extractPdfText } = await import('./tools/pdf/extractText')
        if (!file) throw new Error('Pick a PDF first.')
        const extracted = await extractPdfText(file)
        const blob = new Blob([extracted.text], { type: 'text/plain;charset=utf-8' })
        setTextOutput(extracted.text)
        result = {
          blob,
          outputName: extracted.fileName,
          meta: {
            originalBytes: file.size,
            processedBytes: blob.size,
          },
        }
      }

      if (!result) {
        throw new Error('Unsupported tool mode')
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

  const activeTool = useMemo(() => TOOL_OPTIONS.find((entry) => entry.id === tool) as ToolOption, [tool])

  const canProcess = useMemo(() => {
    if (tool === 'pdf-merge' || tool === 'images-to-pdf') {
      return multiFiles.length > 0
    }
    return Boolean(file)
  }, [file, multiFiles.length, tool])

  const acceptPrefix = isImageTool(tool) || tool === 'images-to-pdf' ? 'image/' : 'application/pdf'
  const acceptFilter = isImageTool(tool) || tool === 'images-to-pdf' ? 'image/*' : 'application/pdf'

  function renderControls() {
    return (
      <div className="controls-stack">
        {(tool === 'pdf-merge' || tool === 'images-to-pdf') && (
          <label className="control-inline">
            <span>{tool === 'pdf-merge' ? 'Select multiple PDF files' : 'Select multiple image files'}</span>
            <input
              type="file"
              accept={tool === 'pdf-merge' ? 'application/pdf' : 'image/*'}
              multiple
              onChange={(event) => onMultiFilesSelected(event.target.files)}
            />
            <small>{multiFiles.length} file(s) selected</small>
          </label>
        )}

        {tool === 'compress' && (
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
        )}

        {tool === 'resize' && (
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
              <input type="checkbox" checked={lockAspect} onChange={(event) => setLockAspect(event.target.checked)} />
              <span>Keep aspect ratio</span>
            </label>
          </>
        )}

        {tool === 'convert' && (
          <>
            <label className="control-inline">
              <span>Output format</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as 'image/png' | 'image/jpeg' | 'image/webp')}
              >
                <option value="image/webp">WebP</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </label>
            {format !== 'image/png' && (
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
            )}
          </>
        )}

        {tool === 'pdf-split' && (
          <>
            <label className="control-inline">
              <span>Split mode</span>
              <select value={splitMode} onChange={(event) => setSplitMode(event.target.value as 'range' | 'single-page-preview')}>
                <option value="range">Range split (example: 1-3,5)</option>
                <option value="single-page-preview">Single-page preview split</option>
              </select>
            </label>
            {splitMode === 'range' && (
              <label className="control-inline">
                <span>Page range</span>
                <input value={pageSpec} onChange={(event) => setPageSpec(event.target.value)} placeholder="1-3,5" />
              </label>
            )}
          </>
        )}

        {tool === 'pdf-rotate' && (
          <>
            <label className="control-inline">
              <span>Angle</span>
              <select value={rotateAngle} onChange={(event) => setRotateAngle(Number(event.target.value) as 90 | 180 | 270)}>
                <option value={90}>90 degrees</option>
                <option value={180}>180 degrees</option>
                <option value={270}>270 degrees</option>
              </select>
            </label>
            <label className="control-inline">
              <span>Page selection</span>
              <input value={pageSpec} onChange={(event) => setPageSpec(event.target.value)} placeholder="Leave empty for all pages" />
            </label>
          </>
        )}

        {tool === 'pdf-reorder' && (
          <>
            <label className="control-inline">
              <span>Delete pages (optional)</span>
              <input value={deleteSpec} onChange={(event) => setDeleteSpec(event.target.value)} placeholder="2,4-5" />
            </label>
            <label className="control-inline">
              <span>Reorder pages after deletion (optional)</span>
              <input value={orderSpec} onChange={(event) => setOrderSpec(event.target.value)} placeholder="3,1,2" />
            </label>
          </>
        )}

        {tool === 'pdf-watermark' && (
          <>
            <label className="control-inline">
              <span>Watermark text</span>
              <input value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} />
            </label>
            <label className="control">
              <span>Opacity: {Math.round(watermarkOpacity * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.01"
                value={watermarkOpacity}
                onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
              />
            </label>
          </>
        )}

        {tool === 'pdf-protect' && (
          <label className="control-inline">
            <span>Password (Phase 2 preview validation)</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
        )}

        <button className="process-button" type="button" disabled={busy || !canProcess} onClick={processCurrentFile}>
          {busy ? 'Processing...' : 'Process File'}
        </button>
        {error ? <p className="error-copy">{error}</p> : null}
      </div>
    )
  }

  function renderDropZone() {
    if (tool === 'pdf-merge' || tool === 'images-to-pdf') {
      return (
        <section className="result-card pending">
          <h3>Multi-file Input</h3>
          <p>
            Use the controls panel to select multiple files for {tool === 'pdf-merge' ? 'merge' : 'images-to-pdf'}.
          </p>
        </section>
      )
    }

    return (
      <>
        <FileDropZone
          acceptedMimePrefix={acceptPrefix}
          accept={acceptFilter}
          title={isImageTool(tool) ? 'Drop an image here' : 'Drop a PDF here'}
          subtitle="or click to browse your device"
          file={file}
          onFileSelected={onFileSelected}
        />
        {previewUrl && isImageTool(tool) ? (
          <figure className="preview-card">
            <img src={previewUrl} alt="Selected input preview" />
            <figcaption>Input preview</figcaption>
          </figure>
        ) : null}
      </>
    )
  }

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
                setFile(null)
                setMultiFiles([])
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
        controls={renderControls()}
        dropZone={renderDropZone()}
        result={
          <>
            <DownloadResult
              outputUrl={outputUrl}
              outputName={outputName}
              originalBytes={originalBytes}
              processedBytes={processedBytes}
            />
            {textOutput ? <textarea className="text-preview" readOnly value={textOutput}></textarea> : null}
            {outputUrl && isImageTool(tool) ? (
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

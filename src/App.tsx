import { useEffect, useMemo, useState } from 'react'
import { DownloadResult } from './shell/DownloadResult'
import { FileDropZone } from './shell/FileDropZone'
import { PrivacyBanner } from './shell/PrivacyBanner'
import { ToolLayout } from './shell/ToolLayout'
import { compressImage } from './tools/image/compress'
import { convertImage } from './tools/image/convert'
import { resizeImage } from './tools/image/resize'
import { cropImage } from './tools/image/crop'
import { rotateFlipImage } from './tools/image/rotateFlip'
import { watermarkImage } from './tools/image/watermark'
import { collageImages } from './tools/image/collage'
import { readExif, stripExif } from './tools/image/exif'
import { removeImageBackground } from './tools/image/backgroundRemove'
import { generateQrPng } from './tools/utils/qr'
import { processBase64, type Base64Mode } from './tools/utils/base64'
import { generateHash, type HashAlgorithm } from './tools/utils/hash'
import { convertColor } from './tools/utils/color'
import { processJson, type JsonMode } from './tools/utils/json'
import type { ToolId } from './types'

const IMAGE_TOOL_OPTIONS = [
  { id: 'compress', label: 'Image Compressor', subtitle: 'Shrink file size with quality control.' },
  { id: 'resize', label: 'Image Resizer', subtitle: 'Resize with aspect lock for precise dimensions.' },
  { id: 'convert', label: 'Format Converter', subtitle: 'Convert PNG, JPG, and WebP in-browser.' },
  { id: 'crop', label: 'Image Crop', subtitle: 'Crop image using percentage-based viewport controls.' },
  { id: 'rotate-flip', label: 'Rotate / Flip', subtitle: 'Rotate by fixed angles and flip horizontally or vertically.' },
  { id: 'image-watermark', label: 'Image Watermark', subtitle: 'Apply text or logo watermark with placement control.' },
  { id: 'collage', label: 'Image Collage', subtitle: 'Combine multiple images into a configurable grid layout.' },
  { id: 'exif-view', label: 'EXIF Viewer', subtitle: 'Inspect metadata and privacy-sensitive camera fields.' },
  { id: 'exif-strip', label: 'EXIF Stripper', subtitle: 'Re-export image without embedded metadata.' },
  { id: 'background-remove', label: 'Background Remove', subtitle: 'Run segmentation model in-browser to isolate subject.' },
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

const UTILITY_TOOL_OPTIONS = [
  { id: 'util-qr', label: 'QR Generator', subtitle: 'Generate PNG QR codes from text or URLs.' },
  { id: 'util-base64', label: 'Base64 Encode/Decode', subtitle: 'Encode text/files or decode Base64 payloads locally.' },
  { id: 'util-hash', label: 'Hash Generator', subtitle: 'Create SHA-256/SHA-384/SHA-512 digests in-browser.' },
  { id: 'util-color', label: 'Color Converter', subtitle: 'Convert between HEX, RGB, and HSL formats.' },
  { id: 'util-json', label: 'JSON Formatter', subtitle: 'Format, minify, or validate JSON payloads safely.' },
] as const

const TOOL_OPTIONS = [...IMAGE_TOOL_OPTIONS, ...PDF_TOOL_OPTIONS, ...UTILITY_TOOL_OPTIONS]

type ToolOption = (typeof TOOL_OPTIONS)[number]

function isImageTool(tool: ToolId): boolean {
  return (
    tool === 'compress' ||
    tool === 'resize' ||
    tool === 'convert' ||
    tool === 'crop' ||
    tool === 'rotate-flip' ||
    tool === 'image-watermark' ||
    tool === 'collage' ||
    tool === 'exif-view' ||
    tool === 'exif-strip' ||
    tool === 'background-remove'
  )
}

function isUtilityTool(tool: ToolId): boolean {
  return (
    tool === 'util-qr' ||
    tool === 'util-base64' ||
    tool === 'util-hash' ||
    tool === 'util-color' ||
    tool === 'util-json'
  )
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
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const [cropWidth, setCropWidth] = useState(100)
  const [cropHeight, setCropHeight] = useState(100)
  const [imageRotateAngle, setImageRotateAngle] = useState<0 | 90 | 180 | 270>(90)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right')
  const [watermarkLogoFile, setWatermarkLogoFile] = useState<File | null>(null)
  const [collagePreset, setCollagePreset] = useState('2x2')
  const [collageGap, setCollageGap] = useState(16)
  const [collageBg, setCollageBg] = useState('#ffffff')
  const [qrText, setQrText] = useState('https://github.com/starrylight90/airlock')
  const [qrSize, setQrSize] = useState(512)
  const [qrErrorLevel, setQrErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [base64Mode, setBase64Mode] = useState<Base64Mode>('encode')
  const [base64Source, setBase64Source] = useState<'text' | 'file'>('text')
  const [base64Input, setBase64Input] = useState('')
  const [hashInputMode, setHashInputMode] = useState<'text' | 'file'>('text')
  const [hashInput, setHashInput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [colorInput, setColorInput] = useState('#136F63')
  const [jsonInput, setJsonInput] = useState('{"airlock": true}')
  const [jsonMode, setJsonMode] = useState<JsonMode>('format')

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

  function resetToolSpecificState() {
    setCropX(0)
    setCropY(0)
    setCropWidth(100)
    setCropHeight(100)
    setImageRotateAngle(90)
    setFlipHorizontal(false)
    setFlipVertical(false)
    setWatermarkLogoFile(null)
    setBase64Input('')
    setHashInput('')
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

    if (!nextFile.type.startsWith('image/')) {
      return
    }

    const image = new Image()
    image.onload = () => {
      setWidth(image.naturalWidth)
      setHeight(image.naturalHeight)
      setAspectRatio(image.naturalWidth / image.naturalHeight)
      setCropX(0)
      setCropY(0)
      setCropWidth(100)
      setCropHeight(100)
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
      } else if (tool === 'crop') {
        if (!file) throw new Error('Pick an image first.')
        result = await cropImage(file, { x: cropX, y: cropY, width: cropWidth, height: cropHeight })
      } else if (tool === 'rotate-flip') {
        if (!file) throw new Error('Pick an image first.')
        result = await rotateFlipImage(file, imageRotateAngle, flipHorizontal, flipVertical)
      } else if (tool === 'image-watermark') {
        if (!file) throw new Error('Pick an image first.')
        result = await watermarkImage(file, watermarkText, watermarkOpacity, watermarkPosition, watermarkLogoFile)
      } else if (tool === 'collage') {
        result = await collageImages(multiFiles, collagePreset, collageGap, collageBg)
      } else if (tool === 'exif-view') {
        if (!file) throw new Error('Pick an image first.')
        const exif = await readExif(file)
        const pretty = exif ? JSON.stringify(exif, null, 2) : 'No EXIF metadata found.'
        const blob = new Blob([pretty], { type: 'application/json;charset=utf-8' })
        setTextOutput(pretty)
        result = {
          blob,
          outputName: `${file.name.replace(/\.[^.]+$/, '')}-exif.json`,
          meta: {
            originalBytes: file.size,
            processedBytes: blob.size,
          },
        }
      } else if (tool === 'exif-strip') {
        if (!file) throw new Error('Pick an image first.')
        result = await stripExif(file)
      } else if (tool === 'background-remove') {
        if (!file) throw new Error('Pick an image first.')
        result = await removeImageBackground(file)
      } else if (tool === 'util-qr') {
        result = await generateQrPng(qrText, qrSize, qrErrorLevel)
      } else if (tool === 'util-base64') {
        const base64Result = await processBase64(
          base64Mode,
          base64Input,
          base64Source === 'file' ? file : null,
        )
        setTextOutput(base64Result.textPreview)
        result = base64Result.result
      } else if (tool === 'util-hash') {
        const hashResult = await generateHash(
          hashAlgorithm,
          hashInput,
          hashInputMode === 'file' ? file : null,
        )
        setTextOutput(hashResult.digest)
        result = hashResult.result
      } else if (tool === 'util-color') {
        const converted = convertColor(colorInput)
        const pretty = JSON.stringify(converted, null, 2)
        const blob = new Blob([pretty], { type: 'application/json;charset=utf-8' })
        setTextOutput(pretty)
        result = {
          blob,
          outputName: 'airlock-color-conversion.json',
          meta: {
            originalBytes: new TextEncoder().encode(colorInput).byteLength,
            processedBytes: blob.size,
          },
        }
      } else if (tool === 'util-json') {
        const jsonResult = processJson(jsonInput, jsonMode)
        setTextOutput(jsonResult.output)
        const blob = new Blob([jsonResult.output], {
          type: jsonMode === 'validate' ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8',
        })
        result = {
          blob,
          outputName:
            jsonMode === 'format'
              ? 'airlock-formatted.json'
              : jsonMode === 'minify'
                ? 'airlock-minified.json'
                : 'airlock-json-validation.txt',
          meta: {
            originalBytes: new TextEncoder().encode(jsonInput).byteLength,
            processedBytes: blob.size,
          },
        }
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
    if (tool === 'util-qr') {
      return qrText.trim().length > 0
    }
    if (tool === 'util-color') {
      return colorInput.trim().length > 0
    }
    if (tool === 'util-json') {
      return jsonInput.trim().length > 0
    }
    if (tool === 'util-base64') {
      return base64Source === 'file' ? Boolean(file) : base64Input.trim().length > 0
    }
    if (tool === 'util-hash') {
      return hashInputMode === 'file' ? Boolean(file) : hashInput.trim().length > 0
    }
    if (tool === 'pdf-merge' || tool === 'images-to-pdf' || tool === 'collage') {
      return multiFiles.length > 0
    }
    return Boolean(file)
  }, [
    base64Input,
    base64Source,
    colorInput,
    file,
    hashInput,
    hashInputMode,
    jsonInput,
    multiFiles.length,
    qrText,
    tool,
  ])

  const acceptPrefix =
    isImageTool(tool) || tool === 'images-to-pdf'
      ? 'image/'
      : tool === 'util-base64' || tool === 'util-hash'
        ? ''
        : 'application/pdf'
  const acceptFilter =
    isImageTool(tool) || tool === 'images-to-pdf'
      ? 'image/*'
      : tool === 'util-base64' || tool === 'util-hash'
        ? '*/*'
        : 'application/pdf'

  function renderControls() {
    return (
      <div className="controls-stack">
        {(tool === 'pdf-merge' || tool === 'images-to-pdf' || tool === 'collage') && (
          <label className="control-inline">
            <span>
              {tool === 'pdf-merge'
                ? 'Select multiple PDF files'
                : tool === 'collage'
                  ? 'Select multiple images for collage'
                  : 'Select multiple image files'}
            </span>
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

        {tool === 'crop' && (
          <>
            <label className="control-inline">
              <span>Crop X (%)</span>
              <input type="number" min={0} max={99} value={cropX} onChange={(event) => setCropX(Math.max(0, Math.min(99, Number(event.target.value) || 0)))} />
            </label>
            <label className="control-inline">
              <span>Crop Y (%)</span>
              <input type="number" min={0} max={99} value={cropY} onChange={(event) => setCropY(Math.max(0, Math.min(99, Number(event.target.value) || 0)))} />
            </label>
            <label className="control-inline">
              <span>Crop Width (%)</span>
              <input type="number" min={1} max={100} value={cropWidth} onChange={(event) => setCropWidth(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} />
            </label>
            <label className="control-inline">
              <span>Crop Height (%)</span>
              <input type="number" min={1} max={100} value={cropHeight} onChange={(event) => setCropHeight(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} />
            </label>
          </>
        )}

        {tool === 'rotate-flip' && (
          <>
            <label className="control-inline">
              <span>Rotation</span>
              <select value={imageRotateAngle} onChange={(event) => setImageRotateAngle(Number(event.target.value) as 0 | 90 | 180 | 270)}>
                <option value={0}>0 degrees</option>
                <option value={90}>90 degrees</option>
                <option value={180}>180 degrees</option>
                <option value={270}>270 degrees</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={flipHorizontal} onChange={(event) => setFlipHorizontal(event.target.checked)} />
              <span>Flip horizontal</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={flipVertical} onChange={(event) => setFlipVertical(event.target.checked)} />
              <span>Flip vertical</span>
            </label>
          </>
        )}

        {tool === 'image-watermark' && (
          <>
            <label className="control-inline">
              <span>Watermark text</span>
              <input value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} />
            </label>
            <label className="control-inline">
              <span>Optional logo overlay</span>
              <input type="file" accept="image/*" onChange={(event) => setWatermarkLogoFile(event.target.files?.[0] ?? null)} />
              <small>{watermarkLogoFile ? watermarkLogoFile.name : 'No logo selected (text watermark only)'}</small>
            </label>
            <label className="control-inline">
              <span>Placement</span>
              <select
                value={watermarkPosition}
                onChange={(event) =>
                  setWatermarkPosition(
                    event.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
                  )
                }
              >
                <option value="top-left">Top left</option>
                <option value="top-right">Top right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="center">Center</option>
              </select>
            </label>
            <label className="control">
              <span>Opacity: {Math.round(watermarkOpacity * 100)}%</span>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.01"
                value={watermarkOpacity}
                onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
              />
            </label>
          </>
        )}

        {tool === 'collage' && (
          <>
            <label className="control-inline">
              <span>Grid preset</span>
              <select value={collagePreset} onChange={(event) => setCollagePreset(event.target.value)}>
                <option value="2x2">2 x 2</option>
                <option value="3x3">3 x 3</option>
                <option value="4x2">4 x 2</option>
              </select>
            </label>
            <label className="control-inline">
              <span>Gap (px)</span>
              <input type="number" min={0} max={96} value={collageGap} onChange={(event) => setCollageGap(Math.max(0, Number(event.target.value) || 0))} />
            </label>
            <label className="control-inline">
              <span>Background color</span>
              <input type="color" value={collageBg} onChange={(event) => setCollageBg(event.target.value)} />
            </label>
          </>
        )}

        {tool === 'util-qr' && (
          <>
            <label className="control-inline">
              <span>QR content</span>
              <textarea
                rows={4}
                value={qrText}
                onChange={(event) => setQrText(event.target.value)}
                placeholder="https://example.com"
              ></textarea>
            </label>
            <label className="control-inline">
              <span>PNG size (px)</span>
              <input
                type="number"
                min={128}
                max={2048}
                value={qrSize}
                onChange={(event) => setQrSize(Math.max(128, Number(event.target.value) || 128))}
              />
            </label>
            <label className="control-inline">
              <span>Error correction</span>
              <select
                value={qrErrorLevel}
                onChange={(event) => setQrErrorLevel(event.target.value as 'L' | 'M' | 'Q' | 'H')}
              >
                <option value="L">Low (L)</option>
                <option value="M">Medium (M)</option>
                <option value="Q">Quartile (Q)</option>
                <option value="H">High (H)</option>
              </select>
            </label>
          </>
        )}

        {tool === 'util-base64' && (
          <>
            <label className="control-inline">
              <span>Mode</span>
              <select value={base64Mode} onChange={(event) => setBase64Mode(event.target.value as Base64Mode)}>
                <option value="encode">Encode</option>
                <option value="decode">Decode</option>
              </select>
            </label>
            {base64Mode === 'encode' && (
              <label className="control-inline">
                <span>Input source</span>
                <select
                  value={base64Source}
                  onChange={(event) => setBase64Source(event.target.value as 'text' | 'file')}
                >
                  <option value="text">Text</option>
                  <option value="file">File</option>
                </select>
              </label>
            )}
            {(base64Mode === 'decode' || base64Source === 'text') && (
              <label className="control-inline">
                <span>{base64Mode === 'decode' ? 'Base64 payload' : 'Text input'}</span>
                <textarea
                  rows={6}
                  value={base64Input}
                  onChange={(event) => setBase64Input(event.target.value)}
                  placeholder={
                    base64Mode === 'decode'
                      ? 'Paste Base64 or data URL'
                      : 'Enter text to convert into Base64 output'
                  }
                ></textarea>
              </label>
            )}
          </>
        )}

        {tool === 'util-hash' && (
          <>
            <label className="control-inline">
              <span>Algorithm</span>
              <select
                value={hashAlgorithm}
                onChange={(event) => setHashAlgorithm(event.target.value as HashAlgorithm)}
              >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </label>
            <label className="control-inline">
              <span>Input source</span>
              <select
                value={hashInputMode}
                onChange={(event) => setHashInputMode(event.target.value as 'text' | 'file')}
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>
            </label>
            {hashInputMode === 'text' && (
              <label className="control-inline">
                <span>Text input</span>
                <textarea
                  rows={5}
                  value={hashInput}
                  onChange={(event) => setHashInput(event.target.value)}
                  placeholder="Enter text to hash"
                ></textarea>
              </label>
            )}
          </>
        )}

        {tool === 'util-color' && (
          <label className="control-inline">
            <span>Color input (#hex, rgb, hsl)</span>
            <input
              value={colorInput}
              onChange={(event) => setColorInput(event.target.value)}
              placeholder="#136F63 or rgb(19, 111, 99)"
            />
          </label>
        )}

        {tool === 'util-json' && (
          <>
            <label className="control-inline">
              <span>Mode</span>
              <select value={jsonMode} onChange={(event) => setJsonMode(event.target.value as JsonMode)}>
                <option value="format">Format</option>
                <option value="minify">Minify</option>
                <option value="validate">Validate</option>
              </select>
            </label>
            <label className="control-inline">
              <span>JSON input</span>
              <textarea
                rows={9}
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
                placeholder='{"airlock": true}'
              ></textarea>
            </label>
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
    if (tool === 'util-qr' || tool === 'util-color' || tool === 'util-json') {
      return (
        <section className="result-card pending">
          <h3>Direct Input Mode</h3>
          <p>This utility uses control-panel input only. No file upload is required.</p>
        </section>
      )
    }

    if (
      (tool === 'util-base64' && base64Mode === 'encode' && base64Source === 'text') ||
      (tool === 'util-base64' && base64Mode === 'decode') ||
      (tool === 'util-hash' && hashInputMode === 'text')
    ) {
      return (
        <section className="result-card pending">
          <h3>Text Input Mode</h3>
          <p>File drop zone is disabled for this mode. Provide input in the controls panel.</p>
        </section>
      )
    }

    if (tool === 'pdf-merge' || tool === 'images-to-pdf' || tool === 'collage') {
      return (
        <section className="result-card pending">
          <h3>Multi-file Input</h3>
          <p>
            Use the controls panel to select multiple files for{' '}
            {tool === 'pdf-merge' ? 'merge' : tool === 'collage' ? 'collage' : 'images-to-pdf'}.
          </p>
        </section>
      )
    }

    return (
      <>
        <FileDropZone
          acceptedMimePrefix={acceptPrefix}
          accept={acceptFilter}
          title={isImageTool(tool) ? 'Drop an image here' : isUtilityTool(tool) ? 'Drop a file here' : 'Drop a PDF here'}
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
          <section className="tool-group">
            <p className="tool-group-title">Image Tools</p>
            {IMAGE_TOOL_OPTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === tool ? 'active' : ''}
                onClick={() => {
                  setTool(entry.id)
                  setFile(null)
                  setMultiFiles([])
                  resetOutputs()
                  resetToolSpecificState()
                }}
              >
                {entry.label}
              </button>
            ))}
          </section>
          <section className="tool-group">
            <p className="tool-group-title">PDF Tools</p>
            {PDF_TOOL_OPTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === tool ? 'active' : ''}
                onClick={() => {
                  setTool(entry.id)
                  setFile(null)
                  setMultiFiles([])
                  resetOutputs()
                  resetToolSpecificState()
                }}
              >
                {entry.label}
              </button>
            ))}
          </section>
          <section className="tool-group">
            <p className="tool-group-title">Utility Tools</p>
            {UTILITY_TOOL_OPTIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === tool ? 'active' : ''}
                onClick={() => {
                  setTool(entry.id)
                  setFile(null)
                  setMultiFiles([])
                  resetOutputs()
                  resetToolSpecificState()
                }}
              >
                {entry.label}
              </button>
            ))}
          </section>
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
            {outputUrl && isImageTool(tool) && tool !== 'exif-view' ? (
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

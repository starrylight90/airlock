# Airlock

Airlock is a local-first file utility suite. Every file operation runs in the browser. No uploads. No backend processing.

## Why it exists

- Most file tools require upload to a server.
- Airlock is designed for privacy-sensitive workflows where local-only processing is non-negotiable.
- The UI is built to be fast, clear, and production-friendly for open-source adoption.

## Current status (Phase 4)

Implemented in this version:

- Shared shell with tool switching
- Persistent privacy banner
- Drag-and-drop file intake with browse fallback
- Output card with size delta and one-click download
- Image Compressor
- Image Resizer (aspect ratio lock)
- Format Converter (PNG, JPEG, WebP)

Image tools added in Phase 3:

- Image Crop (percentage-based crop box)
- Rotate / Flip
- Image Watermark (text + optional logo overlay)
- Image Collage (multi-file grid)
- EXIF Viewer
- EXIF Stripper (re-export without metadata)
- Background Remove (in-browser model)

Utility tools added in Phase 4:

- QR Code Generator (PNG output)
- Base64 Encode/Decode (text and file workflows)
- Hash Generator (SHA-256, SHA-384, SHA-512)
- Color Converter (HEX, RGB, HSL)
- JSON Formatter / Minifier / Validator

PDF tools added in Phase 2:

- PDF Merge (multi-file)
- PDF Split (range mode and single-page preview split)
- PDF Rotate (selected pages)
- PDF Reorder/Delete
- PDF Watermark (text)
- PDF to Images (ZIP)
- Images to PDF
- PDF Text Extraction
- PDF Password flow placeholder with explicit validation and transparent limitation note

## Local-only guarantee

Airlock processes files in browser memory using canvas and local APIs. During processing, the app does not send file payloads to any remote server.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test
```

Current test coverage focuses on PDF page-selection parsing logic used by split/rotate/reorder flows.
Phase 3 adds unit coverage for image math helpers used by crop and collage workflows.
Phase 4 adds utility coverage for color conversion and JSON validation/formatting behavior.

## Project structure

```text
src/
  shell/
    FileDropZone.tsx
    DownloadResult.tsx
    PrivacyBanner.tsx
    ToolLayout.tsx
  tools/
    image/
      compress.ts
      resize.ts
      convert.ts
      crop.ts
      rotateFlip.ts
      watermark.ts
      collage.ts
      exif.ts
      backgroundRemove.ts
      math.ts
      shared.ts
    utils/
      qr.ts
      base64.ts
      hash.ts
      color.ts
      json.ts
    pdf/
      merge.ts
      split.ts
      rotate.ts
      reorderDelete.ts
      watermark.ts
      pdfToImages.ts
      imagesToPdf.ts
      extractText.ts
      common.ts
  App.tsx
  index.css
```

## Known limitations (Phase 4)

- Password protect/unlock is intentionally marked as a transparent placeholder in this phase.
- Per-page split currently exposes range split and a single-page preview split; full one-file-per-page bundle mode is planned for a follow-up.
- PDF rendering uses browser memory; very large PDFs may need future streaming optimizations.
- Background removal model can take longer on first run because model assets initialize in browser context.
- EXIF availability depends on source format and device metadata behavior.
- Base64 decode assumes valid payload input; malformed payloads surface explicit decoding errors.

## Next phases

- Phase 3: advanced image tools
- Phase 4: utilities pack
- Phase 5: batch and polish
- Phase 6: offline packaging
- Phase 7: docs and demos

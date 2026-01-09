# Airlock

Airlock is a local-first file utility suite. Every file operation runs in the browser. No uploads. No backend processing.

## Why it exists

- Most file tools require upload to a server.
- Airlock is designed for privacy-sensitive workflows where local-only processing is non-negotiable.
- The UI is built to be fast, clear, and production-friendly for open-source adoption.

## Current status (Phase 2)

Implemented in this version:

- Shared shell with tool switching
- Persistent privacy banner
- Drag-and-drop file intake with browse fallback
- Output card with size delta and one-click download
- Image Compressor
- Image Resizer (aspect ratio lock)
- Format Converter (PNG, JPEG, WebP)

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
      shared.ts
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

## Known limitations (Phase 2)

- Password protect/unlock is intentionally marked as a transparent placeholder in this phase.
- Per-page split currently exposes range split and a single-page preview split; full one-file-per-page bundle mode is planned for a follow-up.
- PDF rendering uses browser memory; very large PDFs may need future streaming optimizations.

## Next phases

- Phase 3: advanced image tools
- Phase 4: utilities pack
- Phase 5: batch and polish
- Phase 6: offline packaging
- Phase 7: docs and demos

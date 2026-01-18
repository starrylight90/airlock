# Airlock

Airlock is a local-first file utility suite. Every file operation runs in the browser. No uploads. No backend processing.

## Why it exists

- Most file tools require upload to a server.
- Airlock is designed for privacy-sensitive workflows where local-only processing is non-negotiable.
- The UI is built to be fast, clear, and production-friendly for open-source adoption.

## Current status (Phase 7)

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

Phase 5 additions:

- Batch Image Pipeline (compress, resize, convert)
- ZIP packaging for batch output
- Theme toggle (light/dark) and responsive polish
- Expanded UI smoke coverage across all tool groups

Phase 6 additions:

- Offline artifact generation (`dist/offline.html`) with inlined shell assets and rewritten local paths
- Release packaging for hosted and offline distributions under `release/`
- Verified `file://` runtime for offline distribution shell and all tool routes

Phase 7 additions:

- README restructuring for release readability with collapsed screenshot galleries
- Packaging helper tests for offline/release script behavior
- Production hardening command path (`hardening:prod`) for pre-release verification

Audit notes:

- Local-only checklist and results: `docs/phase5-local-only-audit.md`

Packaging notes:

- Hosted artifact: `release/hosted` (standard Vite output)
- Offline artifact: `release/offline/airlock-offline.html` plus sibling `release/offline/assets`

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

## Offline and release artifacts (Phase 6)

```bash
npm run build:offline
npm run release:artifacts
```

Generated outputs:

- `dist/offline.html`
- `release/hosted/*`
- `release/offline/airlock-offline.html`
- `release/offline/assets/*`

## Tests

```bash
npm run test
```

Current test coverage focuses on PDF page-selection parsing logic used by split/rotate/reorder flows.
Phase 3 adds unit coverage for image math helpers used by crop and collage workflows.
Phase 4 adds utility coverage for color conversion and JSON validation/formatting behavior.
Phase 5 adds batch planning tests and end-to-end UI validation for upload/edit/export flows.
Phase 7 adds packaging helper coverage for offline asset path rewriting and release-note generation.

## Production hardening

```bash
npm run hardening:prod
```

This command runs linting, all unit tests, release artifact generation, and artifact verification checks.

## Project structure

```text
src/
  shell/
    FileDropZone.tsx
    DownloadResult.tsx
    PrivacyBanner.tsx
    ToolLayout.tsx
  tools/
    batch/
      imageBatch.ts
      plan.ts
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

## Known limitations (Phase 7)

- Password protect/unlock is intentionally marked as a transparent placeholder in this phase.
- Per-page split currently exposes range split and a single-page preview split; full one-file-per-page bundle mode is planned for a follow-up.
- PDF rendering uses browser memory; very large PDFs may need future streaming optimizations.
- Background removal model can take longer on first run because model assets initialize in browser context.
- EXIF availability depends on source format and device metadata behavior.
- Base64 decode assumes valid payload input; malformed payloads surface explicit decoding errors.
- Background removal performance can vary by browser CPU/GPU and model warm-up state.
- Offline package still requires the local `assets` directory next to `airlock-offline.html` for chunk/model/worker files.

## Next phases

- Phase 8: packaging hardening and optional portable wrappers

## Screenshot evidence (Phase 6)

<details>
<summary><strong>Overview</strong> (click to expand)</summary>

![Offline overview](docs/assets/phase6/00-overview-offline.png)

</details>

<details>
<summary><strong>Image tools</strong> (click to expand)</summary>

![Image Compressor](docs/assets/phase6/01-image-compressor.png)
![Image Resizer](docs/assets/phase6/02-image-resizer.png)
![Format Converter](docs/assets/phase6/03-format-converter.png)
![Image Crop](docs/assets/phase6/04-image-crop.png)
![Rotate / Flip](docs/assets/phase6/05-rotate-flip.png)
![Image Watermark](docs/assets/phase6/06-image-watermark.png)
![Image Collage](docs/assets/phase6/07-image-collage.png)
![EXIF Viewer](docs/assets/phase6/08-exif-viewer.png)
![EXIF Stripper](docs/assets/phase6/09-exif-stripper.png)
![Background Remove](docs/assets/phase6/10-background-remove.png)
![Batch Image Pipeline](docs/assets/phase6/11-batch-image-pipeline.png)

</details>

<details>
<summary><strong>PDF tools</strong> (click to expand)</summary>

![PDF Merge](docs/assets/phase6/12-pdf-merge.png)
![PDF Split](docs/assets/phase6/13-pdf-split.png)
![PDF Rotate](docs/assets/phase6/14-pdf-rotate.png)
![PDF Reorder/Delete](docs/assets/phase6/15-pdf-reorder-delete.png)
![PDF Watermark](docs/assets/phase6/16-pdf-watermark.png)
![PDF Password (Preview)](docs/assets/phase6/17-pdf-password-preview.png)
![PDF to Images](docs/assets/phase6/18-pdf-to-images.png)
![Images to PDF](docs/assets/phase6/19-images-to-pdf.png)
![Extract Text](docs/assets/phase6/20-extract-text.png)

</details>

<details>
<summary><strong>Utility tools</strong> (click to expand)</summary>

![QR Generator](docs/assets/phase6/21-qr-generator.png)
![Base64 Encode/Decode](docs/assets/phase6/22-base64-encode-decode.png)
![Hash Generator](docs/assets/phase6/23-hash-generator.png)
![Color Converter](docs/assets/phase6/24-color-converter.png)
![JSON Formatter](docs/assets/phase6/25-json-formatter.png)

</details>

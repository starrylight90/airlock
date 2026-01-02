# Airlock

Airlock is a local-first file utility suite. Every file operation runs in the browser. No uploads. No backend processing.

## Why it exists

- Most file tools require upload to a server.
- Airlock is designed for privacy-sensitive workflows where local-only processing is non-negotiable.
- The UI is built to be fast, clear, and production-friendly for open-source adoption.

## Current status (Phase 1)

Implemented in this version:

- Shared shell with tool switching
- Persistent privacy banner
- Drag-and-drop file intake with browse fallback
- Output card with size delta and one-click download
- Image Compressor
- Image Resizer (aspect ratio lock)
- Format Converter (PNG, JPEG, WebP)

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
  App.tsx
  index.css
```

## Next phases

- Phase 2: PDF core tools
- Phase 3: advanced image tools
- Phase 4: utilities pack
- Phase 5: batch and polish
- Phase 6: offline packaging
- Phase 7: docs and demos

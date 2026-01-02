# Airlock — Local-First File Tools
### Full build plan

---

## 0. What this project is, and why the architecture is what it is

Airlock is a suite of everyday file tools (PDF editing, image editing, format conversion, and a few small utilities) that run **entirely client-side** — no file ever leaves the browser, no server, no upload. The whole pitch lives or dies on that promise being literally true, so the single most important architectural decision is:

**Everything is a static site. No backend. Ever.** Every "tool" is JavaScript running in the browser via the Canvas API, WebAssembly libraries, or the Web Crypto API. This is what makes "download it and it works offline" a real, checkable claim instead of marketing language — you can open DevTools' Network tab during a demo and show zero requests firing when a file is processed.

This also makes the project far more parallelizable than Ledger: each tool is close to independent, so you can ship incrementally, and a partially-finished tool list still looks complete as long as every listed tool that *is* shipped works fully.

---

## 1. Tech stack and why

| Piece | Choice | Why |
|---|---|---|
| Framework | Plain Vite + vanilla JS/TS, or React if you want component reuse | Keep it light — this is a tool site, not an app; Vite gives fast local dev and a trivial static build |
| Styling | Tailwind CSS | Fast to build a clean, consistent UI across many small tool pages |
| PDF manipulation | `pdf-lib` | Merge, split, rotate, reorder, delete pages, add watermark, password protect — all client-side |
| PDF rendering | `pdf.js` (Mozilla's own library) | Render pages to canvas for preview, PDF → image export, text extraction |
| Image → PDF | `pdf-lib` (create a new PDF, embed each image as a page) | No extra library needed |
| Image editing | Native Canvas API | Resize, crop, rotate, format conversion, compression — all built into the browser, zero dependencies |
| Background removal | `@imgly/background-removal` (runs a segmentation model fully in-browser via WASM/ONNX) | Real client-side ML, no server — this is the flashiest tool in the set |
| EXIF handling | `exifr` (read) / manual buffer stripping (remove) | Read and strip image metadata client-side |
| QR codes | `qrcode` (npm package) | Trivial, generates QR as canvas/SVG entirely client-side |
| Batch downloads | `JSZip` + `file-saver` | Bundle multiple output files into one downloadable zip |
| Packaging | Static build → GitHub Pages (hosted demo) + single self-contained HTML export for offline download | Two distribution paths from one codebase |
| Optional desktop wrapper | Tauri | Later phase — wraps the same web code into a real installable app |

---

## 2. Repo structure

```
airlock/
├── index.html
├── vite.config.ts
├── src/
│   ├── shell/
│   │   ├── FileDropZone.tsx
│   │   ├── ToolLayout.tsx
│   │   ├── PrivacyBanner.tsx        # "🔒 100% local" banner, present on every tool page
│   │   └── DownloadResult.tsx
│   ├── tools/
│   │   ├── pdf/
│   │   │   ├── merge.ts
│   │   │   ├── split.ts
│   │   │   ├── rotate.ts
│   │   │   ├── reorderDelete.ts
│   │   │   ├── watermark.ts
│   │   │   ├── protect.ts
│   │   │   ├── pdfToImages.ts
│   │   │   ├── imagesToPdf.ts
│   │   │   └── extractText.ts
│   │   ├── image/
│   │   │   ├── compress.ts
│   │   │   ├── resize.ts
│   │   │   ├── crop.ts
│   │   │   ├── convert.ts
│   │   │   ├── rotateFlip.ts
│   │   │   ├── watermark.ts
│   │   │   ├── collage.ts
│   │   │   ├── backgroundRemove.ts
│   │   │   └── exif.ts
│   │   ├── misc/
│   │   │   ├── qrGenerator.ts
│   │   │   ├── base64.ts
│   │   │   ├── hashGenerator.ts
│   │   │   ├── colorConverter.ts
│   │   │   └── jsonFormatter.ts
│   ├── pages/                        # one route per tool
│   └── main.tsx
├── public/
├── docs/
│   └── demo.gif
└── README.md
```

Fix this structure before writing tool logic — every tool follows the same shape (`FileDropZone` in → process function → `DownloadResult` out), so nailing the shell first means every subsequent tool is fast to add.

---

## Phase 1 — Shell + first 3 image tools

**Goal:** the reusable UI pattern every other tool will reuse, proven end-to-end with the simplest possible tools.

1. `FileDropZone`: drag-and-drop + click-to-browse, accepts file type constraints per tool, shows a preview thumbnail.
2. `PrivacyBanner`: persistent, visible on every page — this is your actual differentiator, don't bury it.
3. `DownloadResult`: shows the processed output with a download button; for batch results, zips via `JSZip`.
4. **Tool 1 — Image Compressor:** load image onto a `<canvas>`, re-export via `canvas.toBlob(callback, 'image/jpeg', quality)` with a quality slider — show before/after file size live.
5. **Tool 2 — Image Resizer:** canvas redraw at target dimensions, with an aspect-ratio-lock toggle.
6. **Tool 3 — Format Converter:** load any raster format supported by `<img>`, redraw to canvas, export as PNG/JPG/WebP.

**Deliverable:** a deployed site with 3 fully working tools and the shared shell proven out — first real milestone, ship this before touching PDFs.

---

## Phase 2 — PDF tools (the "ilovepdf" core)

All via `pdf-lib` (write operations) and `pdf.js` (rendering/reading):

1. **Merge PDFs** — combine multiple uploaded PDFs into one, with drag-to-reorder before merging.
2. **Split PDF** — extract a page range, or split into one PDF per page.
3. **Rotate pages** — rotate individual pages or the whole document.
4. **Reorder / delete pages** — visual page-thumbnail grid (render each page via `pdf.js` to canvas thumbnails), drag to reorder, click to delete, then re-save via `pdf-lib`.
5. **Add watermark** — text or image overlay, configurable position/opacity, applied across all pages.
6. **Password protect / remove password** — `pdf-lib` supports basic encryption; note the real limitation honestly in your README (browser-side PDF encryption isn't as robust as dedicated tools — say so, don't oversell it).
7. **PDF → Images** — render each page via `pdf.js` to canvas, export as PNG/JPG, zip if multi-page.
8. **Images → PDF** — reverse of the above, embed each image as a full page via `pdf-lib`.
9. **Extract text** — use `pdf.js`'s text layer extraction, output as plain `.txt`.

**Deliverable:** all 9 PDF tools working, each with its own route/page under a shared "PDF Tools" nav section.

---

## Phase 3 — Remaining image tools

1. **Crop** — canvas-based interactive crop UI (a lightweight library like `react-easy-crop` is fine here, or hand-roll with mouse/touch events on canvas).
2. **Rotate / flip** — canvas transform, horizontal/vertical flip and arbitrary rotation.
3. **Watermark** — text or logo overlay on images, same pattern as the PDF watermark tool, reused where possible.
4. **Collage / combine** — take N images, arrange in a grid layout (2x2, 3x3, custom), composite onto one canvas, export as single image.
5. **EXIF viewer** — read and display all metadata (`exifr`), including GPS coordinates if present — this is a good place to make the privacy point directly in the UI ("this photo contains your exact location — strip it below").
6. **EXIF stripper** — re-encode the image via canvas (which naturally drops metadata) or manually zero the EXIF block, output a clean file.
7. **Background remover** — the flashiest tool: `@imgly/background-removal` runs a real segmentation model in-browser via WASM. Flag honestly in the README that first-load is slower (model download, cached after) and quality varies by image — don't oversell it as flawless.

**Deliverable:** full image-tools section complete, background removal specifically recorded as a demo GIF since it's the most visually impressive tool in the whole project.

---

## Phase 4 — Small utility tools (fast to build, rounds out the site)

These are near-zero-effort but make the tool count and perceived breadth much stronger for very little time:

1. **QR code generator** — text/URL in, QR image out, via `qrcode` package.
2. **Base64 encode/decode** — text or file in, encoded string out (and reverse).
3. **Hash generator** — SHA-256/SHA-1/MD5 of text or file, via the browser's native `SubtleCrypto` API (genuinely a nice "I know the platform" detail — no external library needed for SHA family).
4. **Color converter** — HEX/RGB/HSL back and forth, with a live color picker.
5. **JSON formatter/validator** — paste JSON, get pretty-printed + validated output, all client-side.

**Deliverable:** 5 more tools, each roughly an hour or two of work, done in a single focused session.

---

## Phase 5 — Batch processing and polish

1. Add batch mode to the tools where it makes sense (compressor, resizer, format converter, EXIF stripper) — drop N files, process all, download as one zip via `JSZip`.
2. Dark mode toggle, responsive layout pass for mobile.
3. **Audit pass:** go through every tool and confirm, via the browser DevTools Network tab, that zero requests fire during processing. This is not optional — it's the actual claim the whole project is making, verify it explicitly rather than assuming it's true.

**Deliverable:** a verified-clean, polished site — screenshot the empty Network tab during a full tool run as proof, put it in the README.

---

## Phase 6 — Packaging for real offline download

1. **Single-file HTML export:** using `vite-plugin-singlefile` (inlines all JS/CSS into one `.html`), produce a version someone can download from GitHub Releases and open directly, no server, no install.
2. **Optional: Tauri wrapper** — same codebase, packaged as an installable `.exe`/`.app`/`.deb`. Tauri produces much smaller binaries than Electron and needs minimal extra code since your app is already a static site.
3. Publish both: the hosted version (GitHub Pages, for convenience) and the downloadable artifacts (GitHub Releases, for the "actually offline" pitch).

**Deliverable:** a GitHub Release with the single-file HTML and (if you build it) the Tauri binaries attached.

---

## Phase 7 — README and demo

- 30,000-ft brief: what it is, the privacy pitch stated plainly, link to both the hosted demo and the downloadable release.
- Full tool list (all ~20 tools), organized by category.
- A GIF demo of the background-removal tool specifically (most visually convincing).
- The empty-Network-tab screenshot as proof of the local-only claim.
- Known limitations stated honestly (PDF password protection strength, background-removal quality variance, first-load model download time).

---

## Full tool list, for reference

**PDF (9):** Merge · Split · Rotate · Reorder/Delete Pages · Watermark · Password Protect/Remove · PDF→Images · Images→PDF · Extract Text

**Image (9):** Compress · Resize · Crop · Format Convert · Rotate/Flip · Watermark · Collage · EXIF View/Strip · Background Remove

**Utilities (5):** QR Generator · Base64 Encode/Decode · Hash Generator · Color Converter · JSON Formatter

**Total: 23 tools**

---

## Suggested timeline

| Phase | Focus | Est. time |
|---|---|---|
| 1 | Shell + 3 image tools | 3–4 days |
| 2 | 9 PDF tools | 5–6 days |
| 3 | Remaining image tools (incl. bg removal) | 4–5 days |
| 4 | 5 utility tools | 1–2 days |
| 5 | Batch mode + polish + audit | 2–3 days |
| 6 | Packaging (single-file + optional Tauri) | 1–2 days |
| 7 | README + demo | 1 day |

Total: roughly 2.5–3 weeks of focused work. This project is easy to trim without looking unfinished — if time is short, ship Phases 1–2 (12 tools including the full PDF suite) as a strong, complete-feeling v1, and treat Phases 3–4 as a natural v2 you add after applications go out rather than before.
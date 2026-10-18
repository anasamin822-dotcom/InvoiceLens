# Invoice Review

> **Demo mode — extraction is mocked.** No backend, OCR, or API keys required. Everything runs in the browser.

A browser-only React + TypeScript app for reviewing, approving, and editing extracted invoice fields with interactive document annotation.

---

## What It Does

| Step | Action |
|---|---|
| 1 | **Upload** a PDF, PNG, JPG, or WEBP invoice (drag-and-drop or file picker, max 10 MB) |
| 2 | **View** the document with colour-coded bounding-box overlays for each extracted field |
| 3 | **Click a box** on the document → activates the matching field card in the right panel |
| 4 | **Click a card** → highlights and pulses the bounding box on the document |
| 5 | **Approve** a field value (one-click) or **Edit** it inline with live per-field validation |
| 6 | **Audit log** records every approval and change, newest first, with timestamps |
| 7 | **Draw new box** — drag a rectangle on the document, create a custom field or re-align an existing one |
| 8 | **Export JSON** — downloads all reviewed fields + full audit log |
| 9 | State is persisted to `localStorage` keyed by `filename:size` — refresh without losing work |

---

## How to Run

```bash
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:5173
npm run build      # production build (TypeScript strict + Vite)
npm run test       # 62 unit tests via Vitest
```

---

## UI Polish & Design System

* **Style Name:** Linear-style calm dark-on-light productivity dashboard (Refero Styles inspired by Linear / Vercel).
* **Color Palette:** Warm zinc/slate neutral surfaces (`#f8fafc`, `#ffffff`), deep slate text (`#0f172a`), indigo accent (`#4f46e5`), and semantic status colors:
  * Approved: Emerald (`#047857`, `#ecfdf5`)
  * Edited: Amber (`#b45309`, `#fffbeb`)
  * Error: Red (`#b91c1c`, `#fef2f2`)
* **Typography:** Inter with OpenType feature flags (`cv02`, `cv03`, `cv04`, `cv11`, `tnum` tabular numerics) for monetary and date alignment.
* **Micro-interactions & Effects:**
  * **Aceternity Moving Border:** Animated gradient border on upload hero dropzone.
  * **Aceternity Spotlight Glow:** Smooth radial mouse-following illumination on hero cards.
  * **Aceternity Dot Grid Background:** Faint radial dot grid fading out at the edges.
  * **Aceternity-style Animated Progress Bar:** Thin calm progress indicator showing percentage of reviewed fields.
  * **Paper Canvas & Floating Zoom Controls:** Soft layered elevation shadow on the document viewer with floating pill toolbar (+ / - / Reset 100%) keeping % coordinates perfectly aligned.
  * **Single-pulse Bounding Box Select:** Non-looping subtle 350ms selection pulse.
  * **Hover Shimmer CTA Button:** Tactile 1px inner highlight with hover shimmer on "Export JSON".
  * **Non-blocking Toast:** Animated notification upon JSON export without blocking user interactions.
  * **Mobile Slide-down Sheet:** 44px+ accessible touch targets and collapsible audit log on mobile devices (320px–390px).
* **Credits & Attributions:**
  * 3D document & checkmark illustrations: hand-crafted original SVGs (no attribution required).
  * Design Patterns: Inspired by [Aceternity UI](https://ui.aceternity.com), [Refero Styles](https://refero.design), and [Footer.design](https://footer.design). Re-implemented with native React 19 + Tailwind CSS + CSS keyframes.

---

## Demo Mode

Extraction is **fully mocked** — the app ships with three hardcoded fields:

| Field | Mock Value | Document Position |
|---|---|---|
| Invoice Number | `INV-2041` | top-right |
| Invoice Date | `2026-09-14` | just below invoice number |
| Total Amount | `48,250.00` | bottom-right |

The **sample invoice** (`public/sample-invoice.svg`) is hand-crafted so those three values appear exactly where the mock bounding boxes are, giving a realistic demo.

Click **"Load sample invoice"** on the upload screen or in the toolbar to load it instantly.

> When you upload your own document, the mock boxes will not align with the real text — the "Demo mode: extraction is mocked" banner in the viewer makes this explicit.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | Type-safe, component-based |
| Build | Vite 8 | Fast HMR, first-class TS support |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime |
| PDF rendering | pdfjs-dist (page 1, canvas) | Industry-standard browser PDF renderer |
| State | `useReducer` + React Context | Pure reducer is trivially unit-testable; no Zustand needed at this scope |
| Tests | Vitest | Vite-native, no config overhead |

---

## Architecture

```
src/
├── types/          — shared TypeScript types (Field, BoundingBox, LogEntry, AppState)
├── mock/           — mock field data with normalised bounding boxes
├── store/
│   ├── reducer.ts  — pure reducer (LOAD_FILE, APPROVE, EDIT, DRAW, …)
│   └── context.tsx — React context + AppProvider wrapping useReducer
├── lib/
│   ├── coords.ts       — normalizedToPixel / pixelToNormalized helpers
│   ├── validation.ts   — per-field validators (invoice number, ISO date, total)
│   ├── formatting.ts   — timestamp → readable string, generateId
│   └── export.ts       — build + trigger JSON download
├── hooks/
│   ├── usePdfRenderer.ts   — pdfjs-dist page-1 render to <canvas>
│   └── useLocalStorage.ts  — persist/restore fields+log keyed by file name+size
└── components/
    ├── UploadZone.tsx        — drag-drop + file picker + validation
    ├── DocumentViewer.tsx    — PDF canvas / <img> switcher + overlay host
    ├── BoundingBoxOverlay.tsx— %-positioned boxes, active pulse, keyboard a11y
    ├── DrawLayer.tsx         — pointer-driven rectangle draw + field assignment
    ├── FieldPanel.tsx        — summary header + card list
    ├── FieldCard.tsx         — status badge, spotlight glow, inline edit+approve
    ├── EditLog.tsx           — timestamped audit log, newest-first
    └── Toolbar.tsx           — file controls, draw toggle, export button
```

**Key design decisions:**

- **Percentage-based bounding boxes** — `left/top/width/height` as CSS `%` so boxes scale correctly on any container resize without JS.
- **Pure reducer** — all state transitions are testable in isolation as a plain function; no side-effects in the reducer.
- **No animation libraries** — all effects (moving border, box pulse, spotlight glow) use plain CSS `@keyframes` and custom properties; respects `prefers-reduced-motion`.
- **pdfjs-dist v6 API** — `getDocument({ url })` object form; `render({ canvas, viewport })` canvas form (not deprecated `canvasContext`).

---

## Plugging In a Real OCR / LLM Backend

1. Replace `src/mock/fields.ts` with an API call that returns `Field[]`.
2. Bounding boxes must be **normalised** (0–1 relative to page width/height). Convert from pixel coordinates with `pixelToNormalized()` in `src/lib/coords.ts`.
3. Wire the rendered page dimensions from `usePdfRenderer` if your backend returns pixel coordinates.

---

## Known Limitations

- **Single-page PDF** — only page 1 is rendered. Multi-page navigation is future work.
- **Mock boxes** — won't align with an arbitrary uploaded invoice (banner warns the user).
- **No real OCR** — this is a UI review scaffold.

---

## What I'd Do Next With More Time

- Integrate a real OCR/LLM backend (Google Document AI, Amazon Textract, or a custom LLM pipeline).
- Multi-page PDF navigation (prev/next, page counter).
- Confidence score badge per extracted field.
- Bulk "Approve All" button.
- Dark mode toggle.
- CI (GitHub Actions) running `npm run build` and `npm run test` on every PR.
- Screenshot / GIF in this README.

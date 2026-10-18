# Invoice Review

A browser-only React + TypeScript app for reviewing, approving, and editing extracted invoice fields with interactive document annotation.

> ⚠️ **Demo mode**: Extraction is mocked. No backend, OCR, or API keys are required.

---

## What It Does

1. **Upload** a PDF, PNG, JPG, or WEBP invoice (drag-and-drop or file picker, max 10 MB).
2. **View** the document with bounding-box overlays for each extracted field.
3. **Click a box** on the document → activates the matching field card in the sidebar.
4. **Click a card** → highlights and pulses the bounding box on the document.
5. **Approve** a field value (one-click) or **edit** it inline with live validation.
6. **Edit log** records every approval and change, newest first.
7. **Draw new box** mode: drag a rectangle on the document and attach it to an existing field or create a custom one.
8. **Export JSON** downloads the full reviewed fields + audit log.
9. State is persisted to `localStorage` so refreshes don't lose your work.

---

## Screenshots

> _Add a screenshot or GIF here once the app is running._

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict mode) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| PDF rendering | pdfjs-dist (page 1, canvas) |
| State | `useReducer` + Context |
| Tests | Vitest |

---

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build
npm run test      # Unit tests
```

---

## How Extraction Works

Extraction is **fully mocked** — the app ships with three hardcoded fields:

| Field | Mock Value | Bounding Box |
|---|---|---|
| Invoice Number | INV-2041 | top-right |
| Invoice Date | 2026-09-14 | just below invoice number |
| Total Amount | 48,250.00 | bottom-right |

The **sample invoice** (`/public/sample-invoice.svg`) is hand-crafted so the three values appear exactly where the mock boxes are, for a realistic demo.

### Plugging In a Real OCR / LLM Backend

1. Replace `src/mock/fields.ts` with an API call that returns `Field[]`.
2. The `BoundingBox` coordinates should be returned as normalised values (0–1 relative to page width/height). Convert from pixel coordinates using `pixelToNormalized()` in `src/lib/coords.ts`.
3. Wire the `usePdfRenderer` output dimensions to scale the boxes if your backend returns pixel values.

---

## Design Decisions

- **`useReducer` over Zustand** — state transitions are action-driven and easily unit-tested as a pure function.
- **Percentage-based bounding boxes** — boxes are positioned with `left/top/width/height` as percentages so they scale correctly on any container resize without JavaScript.
- **pdfjs-dist for PDF rendering** — renders page 1 to `<canvas>` at device pixel ratio, `<img>` for all image types.
- **No Framer Motion** — all animations use CSS (`@keyframes`, `transition`), respecting `prefers-reduced-motion`.
- **Spotlight hover glow** — achieved with a CSS custom property (`--mouse-x`, `--mouse-y`) set on `mousemove`, zero JS bundle cost.

---

## Known Limitations

- Single-page PDF only (page 1). Multi-page navigation is future work.
- Mock bounding boxes will not align with an arbitrary uploaded invoice — the "Demo mode" banner makes this clear.
- No real OCR/AI extraction — this is a UI scaffold.

---

## What I'd Do Next

- Integrate a real OCR/LLM backend (e.g., Google Document AI, Amazon Textract, or a custom LLM pipeline) as a drop-in for `src/mock/fields.ts`.
- Multi-page PDF navigation (prev/next page controls, page counter).
- Confidence score on each extracted field.
- Bulk approve-all button.
- Dark mode.
- CI workflow (GitHub Actions) running `npm run build` and `npm run test` on every PR.

import { useRef, useState } from 'react';
import type { Field, LoadedFile } from '../types';
import { usePdfRenderer } from '../hooks/usePdfRenderer';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';

interface DocumentViewerProps {
  file: LoadedFile;
  fields: Field[];
  activeFieldKey: string | null;
  onSelectField: (key: string) => void;
  onClearSelection: () => void;
  /** True when file bytes couldn't be restored after reload */
  contentUnavailable?: boolean;
  /** Called when the user clicks "Re-upload file" in the unavailable banner */
  onReupload?: (file: File) => void;
  drawMode?: boolean;
  children?: React.ReactNode;
}

const ZOOM_LEVELS = [0.8, 1.0, 1.25, 1.5];

export function DocumentViewer({
  file,
  fields,
  activeFieldKey,
  onSelectField,
  onClearSelection,
  contentUnavailable = false,
  onReupload,
  drawMode = false,
  children,
}: DocumentViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(1); // Default to 1.0 (100%)

  const currentZoom = ZOOM_LEVELS[zoomIndex];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleZoomReset = () => {
    setZoomIndex(1);
  };

  // Hook handles PDF page 1 rendering to canvas.
  const { loading: pdfLoading, error: pdfError } = usePdfRenderer({
    canvasRef,
    url: file.kind === 'pdf' && !contentUnavailable ? file.url : null,
  });

  // Handle the re-upload button click via a hidden file input
  function handleReuploadClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf';
    input.onchange = () => {
      const chosen = input.files?.[0];
      if (chosen && onReupload) onReupload(chosen);
    };
    input.click();
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-100/60 border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Viewer Header Bar */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-white border-b border-neutral-200/80 text-xs text-neutral-600">
        <div className="flex items-center gap-2 truncate font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" aria-hidden="true" />
          <span className="truncate max-w-[200px] sm:max-w-[260px] text-neutral-900 font-semibold" title={file.name}>
            {file.name}
          </span>
          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-semibold shrink-0">
            {file.kind}
          </span>
        </div>

        {/* Demo Mode Notice */}
        <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-2.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zM8 11.5a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span className="hidden xs:inline">Demo mode: mock extraction</span>
        </div>
      </div>

      {/* Main Document Display Canvas Area */}
      <div className="relative flex-1 overflow-auto p-3 sm:p-6 flex items-start justify-center pb-20">
        {pdfLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
            <div className="flex flex-col items-center gap-2 text-indigo-600">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-neutral-600">Rendering document...</p>
            </div>
          </div>
        )}

        {/* PDF render error */}
        {pdfError && !contentUnavailable && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg max-w-md my-8 text-center">
            {pdfError}
          </div>
        )}

        {/* Content unavailable banner */}
        {contentUnavailable ? (
          <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 text-sm mb-1">File content not available</p>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Your review progress (fields, statuses, edits) is fully restored.
                Re-upload the same file to see the document again.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReuploadClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 min-h-[44px]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 3a.75.75 0 01.75.75v6.19l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 011.06-1.06l1.72 1.72V3.75A.75.75 0 0110 3z" />
                <path d="M3.75 13a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z" />
              </svg>
              Re-upload file
            </button>
          </div>
        ) : (
          /*
            Paper Card Wrapper:
            Scales cleanly with zoom index, keeping document and bounding box overlay 100% aligned.
          */
          <div
            style={{
              width: currentZoom === 1.0 ? '100%' : `${Math.round(currentZoom * 100)}%`,
              maxWidth: currentZoom === 1.0 ? '100%' : 'none',
            }}
            className="relative inline-block bg-white rounded-lg overflow-hidden border border-neutral-200/90 transition-all duration-150"
            style-custom="shadow-paper"
            onClick={onClearSelection}
          >
            {file.kind === 'pdf' ? (
              <canvas
                ref={canvasRef}
                className="block w-full h-auto object-contain"
                aria-label="Rendered invoice PDF page 1"
              />
            ) : (
              <img
                src={file.url}
                alt={file.name}
                onLoad={() => setImageLoaded(true)}
                className="block w-full h-auto object-contain select-none"
                style={{ maxHeight: 'calc(100vh - 160px)' }}
              />
            )}

            {/* Overlay bounding boxes */}
            {(file.kind === 'pdf' ? !pdfLoading : imageLoaded) && (
              <>
                <BoundingBoxOverlay
                  fields={fields}
                  activeFieldKey={activeFieldKey}
                  onSelectField={onSelectField}
                />
                {/* Optional DrawLayer overlay when drawMode is active */}
                {drawMode && children}
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Pill Zoom Toolbar */}
      {!contentUnavailable && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-md border border-neutral-200/90 shadow-md rounded-full text-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            title="Reset zoom to 100%"
            aria-label={`Current zoom ${Math.round(currentZoom * 100)} percent. Click to reset.`}
            className="px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-indigo-600 rounded-md transition-colors tabular-nums min-h-[44px] inline-flex items-center cursor-pointer"
          >
            {Math.round(currentZoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            aria-label="Zoom in"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

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

  // Hook handles PDF page 1 rendering to canvas.
  // url=null when file is an image or content is unavailable — hook is a no-op.
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
    <div className="flex flex-col h-full bg-neutral-100/70 border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
      {/* Viewer Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-200/80 text-xs text-neutral-600">
        <div className="flex items-center gap-2 truncate font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" aria-hidden="true" />
          <span className="truncate max-w-[240px] text-neutral-800" title={file.name}>
            {file.name}
          </span>
          <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-semibold">
            {file.kind}
          </span>
        </div>

        {/* Demo Mode Notice */}
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px] font-medium">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-2.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zM8 11.5a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span>Demo mode: extraction is mocked</span>
        </div>
      </div>

      {/* Main Document Display Area */}
      <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
        {pdfLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
            <div className="flex flex-col items-center gap-2 text-indigo-600">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-neutral-600">Rendering document...</p>
            </div>
          </div>
        )}

        {/* PDF render error — only shown for genuine render failures, not unavailable content */}
        {pdfError && !contentUnavailable && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg max-w-md my-8 text-center">
            {pdfError}
          </div>
        )}

        {/* Content unavailable banner — shown instead of the document */}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
            Page Wrapper:
            Matches the rendered page dimensions exactly, enabling
            BoundingBoxOverlay to use normalized percentage positioning reliably.
            Clicking the blank page area (not a box) clears the active selection.
          */
          <div
            className="relative inline-block max-w-full bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200/80"
            onClick={onClearSelection}
          >
            {file.kind === 'pdf' ? (
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto object-contain"
                aria-label="Rendered invoice PDF page 1"
              />
            ) : (
              <img
                src={file.url}
                alt={file.name}
                onLoad={() => setImageLoaded(true)}
                className="block max-w-full h-auto object-contain select-none"
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
    </div>
  );
}

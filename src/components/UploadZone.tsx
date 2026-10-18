import { useCallback, useRef, useState, type DragEvent, type ChangeEvent, type MouseEvent } from 'react';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const MAX_SIZE_MB = 10;

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  onLoadSample: () => void;
}

function isAccepted(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

export function UploadZone({ onFileAccepted, onLoadSample }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isAccepted(file)) {
        setError(`Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP.`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
        return;
      }
      setError(null);
      onFileAccepted(file);
    },
    [onFileAccepted],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  // Cursor-following spotlight glow effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dropzoneRef.current) return;
    const rect = dropzoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    dropzoneRef.current.style.setProperty('--mouse-x', `${x}px`);
    dropzoneRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/70">
      {/* Aceternity-style dot grid background with radial edge fade */}
      <div
        className="absolute inset-0 dot-grid-faded pointer-events-none opacity-80"
        aria-hidden="true"
      />

      {/* Hero Headline & Subtext */}
      <div className="relative z-10 text-center max-w-xl mx-auto mb-8 sm:mb-10 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200/80 shadow-xs mb-4 text-xs font-medium text-neutral-600">
          <span className="w-2 h-2 rounded-full bg-indigo-600" aria-hidden="true" />
          <span>Interactive Document Extraction</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-500">Offset Take-Home</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          Verify &amp; audit invoice fields with confidence
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-neutral-500 max-w-md mx-auto leading-relaxed">
          Upload any PDF or image to inspect bounding boxes, edit line items, and export structured JSON.
        </p>
      </div>

      {/* Drag & Drop Zone with Spotlight + Moving Border */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg">
        <div
          ref={dropzoneRef}
          role="button"
          tabIndex={0}
          aria-label="Upload invoice — drag and drop or click to browse"
          onMouseMove={handleMouseMove}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          className={[
            'spotlight-card moving-border-active relative rounded-2xl p-8 sm:p-10 cursor-pointer shadow-sm transition-all duration-200 select-none',
            'border border-neutral-200/90 flex flex-col items-center justify-center text-center',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
            dragging
              ? 'bg-indigo-50/70 scale-[1.01] border-indigo-500'
              : 'bg-white hover:shadow-md hover:border-neutral-300',
          ].join(' ')}
        >
          {/* CC0 3D Icon illustration stack */}
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center pointer-events-none">
            <img
              src="/3d-doc.svg"
              alt="3D Document"
              width="88"
              height="88"
              className="drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1">
              <img
                src="/3d-check.svg"
                alt="3D Approved checkmark"
                width="36"
                height="36"
                className="drop-shadow-md"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-neutral-900 text-base sm:text-lg">
              {dragging ? 'Drop invoice to begin' : 'Drag & drop invoice file'}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500">
              or <span className="text-indigo-600 font-medium hover:underline underline-offset-2">browse files from computer</span>
            </p>
            <p className="text-[11px] text-neutral-500 pt-1 font-mono">
              PDF, PNG, JPG, or WEBP &middot; Up to 10 MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTS.join(',')}
            className="sr-only"
            aria-hidden="true"
            onChange={onInputChange}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="relative z-10 mt-4 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 max-w-md w-full text-center shadow-xs"
        >
          {error}
        </div>
      )}

      {/* Load Sample Invoice Quick Action */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            onLoadSample();
          }}
          className="btn-primary-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 hover:text-indigo-600 border border-neutral-200/90 shadow-xs cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Load sample pre-aligned invoice</span>
        </button>
        <span className="text-[11px] text-neutral-500">
          Try the demo document without uploading your own file
        </span>
      </div>
    </div>
  );
}

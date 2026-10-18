import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

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
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-6">
      {/* Dot-grid header background */}
      <div
        className="absolute inset-x-0 top-0 h-56 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #c7d2fe 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#4F46E5" />
            <path d="M9 10h9l5 5v7a1 1 0 01-1 1H9a1 1 0 01-1-1V11a1 1 0 011-1z" fill="white" fillOpacity=".9" />
            <path d="M18 10v5h5" stroke="white" strokeOpacity=".6" strokeWidth="1.5" />
            <rect x="11" y="17" width="10" height="1.5" rx=".75" fill="white" fillOpacity=".7" />
            <rect x="11" y="19.5" width="7" height="1.5" rx=".75" fill="white" fillOpacity=".7" />
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Invoice Review</h1>
        </div>
        <p className="text-neutral-500 text-sm">Upload an invoice to begin AI-assisted field extraction and review.</p>
      </div>

      {/* Drop zone with animated border when active */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload invoice — drag and drop or click to browse"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={[
          'relative z-10 w-full max-w-lg rounded-2xl border-2 border-dashed cursor-pointer',
          'flex flex-col items-center justify-center gap-4 py-14 px-8',
          'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          dragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-neutral-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30',
          // Moving border on the upload zone button
          'upload-zone-moving-border',
        ].join(' ')}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="12" fill={dragging ? '#EEF2FF' : '#F5F3FF'} />
          <path
            d="M16 30V32a2 2 0 002 2h12a2 2 0 002-2v-2M24 14v14M18 20l6-6 6 6"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="text-center">
          <p className="font-semibold text-neutral-800 text-base">
            {dragging ? 'Drop it here!' : 'Drag & drop your invoice'}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            or <span className="text-indigo-600 font-medium underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-neutral-400 mt-2">PDF · PNG · JPG · WEBP — max 10 MB</p>
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

      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 max-w-lg w-full text-center"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setError(null);
          onLoadSample();
        }}
        className="relative z-10 mt-6 text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors duration-150 cursor-pointer"
      >
        Load sample invoice
      </button>
    </div>
  );
}

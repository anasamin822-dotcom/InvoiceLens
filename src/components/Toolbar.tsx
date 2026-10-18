import { useRef, type ChangeEvent } from 'react';

interface ToolbarProps {
  fileName: string;
  drawMode: boolean;
  onToggleDrawMode: () => void;
  onExportJson: () => void;
  onReplaceFile: (file: File) => void;
  onLoadSample: () => void;
}

const ACCEPTED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

export function Toolbar({
  fileName,
  drawMode,
  onToggleDrawMode,
  onExportJson,
  onReplaceFile,
  onLoadSample,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplaceFile(file);
    }
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Active Document */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 tracking-tight leading-none">
                Invoice Review
              </h1>
              <p className="text-[11px] text-neutral-400 leading-none mt-1">
                Extraction &amp; Verification
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-5 w-px bg-neutral-200 mx-1" />

          {/* Current File Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-xs">
            <span className="text-neutral-500">File:</span>
            <span className="font-medium text-neutral-800 truncate max-w-[180px]">
              {fileName}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sample invoice quick loader */}
          <button
            type="button"
            onClick={onLoadSample}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-lg transition-colors cursor-pointer"
            title="Load the pre-aligned sample invoice"
          >
            Load Sample
          </button>

          {/* Draw New Box Toggle */}
          <button
            type="button"
            onClick={onToggleDrawMode}
            aria-pressed={drawMode}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[36px]',
              drawMode
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/50'
                : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 shadow-xs',
            ].join(' ')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>{drawMode ? 'Drawing Mode Active' : 'Draw New Box'}</span>
          </button>

          {/* Replace File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 rounded-lg transition-colors cursor-pointer min-h-[36px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Replace File</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTS.join(',')}
            className="sr-only"
            onChange={handleFileChange}
          />

          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all cursor-pointer min-h-[36px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import { useRef, useState, useEffect, type ChangeEvent } from 'react';

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
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplaceFile(file);
    }
    e.target.value = '';
    setMobileMenuOpen(false);
  };

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Project info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight leading-tight truncate">
                Invoice Review
              </h1>
              {/* Demo Mode Pill */}
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                Demo mode
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-none truncate hidden sm:block">
              Linear-style extraction &amp; audit
            </p>
          </div>

          {/* Active File Pill on desktop */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-md bg-neutral-100/80 border border-neutral-200/80 text-xs text-neutral-600 max-w-[200px]">
            <span className="text-neutral-400 text-[10px] uppercase font-semibold">File</span>
            <span className="font-medium text-neutral-800 truncate" title={fileName}>
              {fileName}
            </span>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Load pre-aligned sample invoice"
          >
            Load Sample
          </button>

          <button
            type="button"
            onClick={onToggleDrawMode}
            aria-pressed={drawMode}
            className={[
              'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              drawMode
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40'
                : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200/90 shadow-xs hover:border-neutral-300',
            ].join(' ')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>{drawMode ? 'Drawing Active' : 'Draw New Box'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-lg shadow-xs hover:border-neutral-300 transition-colors cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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

          {/* Export JSON CTA Button with Shimmer */}
          <button
            type="button"
            onClick={onExportJson}
            className="btn-primary-tactile btn-shimmer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export JSON</span>
          </button>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onExportJson}
            className="btn-primary-tactile btn-shimmer inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export</span>
          </button>

          {/* Mobile Sheet Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle action menu"
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-neutral-200/80 flex flex-col gap-2.5 pb-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1 py-1 bg-neutral-50 rounded-md">
            <span>Current file:</span>
            <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{fileName}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onToggleDrawMode();
                setMobileMenuOpen(false);
              }}
              aria-pressed={drawMode}
              className={[
                'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg min-h-[44px]',
                drawMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200',
              ].join(' ')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>{drawMode ? 'Drawing On' : 'Draw Box'}</span>
            </button>

            <button
              type="button"
              onClick={() => mobileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg min-h-[44px]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Replace</span>
            </button>
            <input
              ref={mobileInputRef}
              type="file"
              accept={ACCEPTED_EXTS.join(',')}
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onLoadSample();
              setMobileMenuOpen(false);
            }}
            className="w-full text-center py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50/60 rounded-lg min-h-[44px] flex items-center justify-center"
          >
            Load Sample Invoice
          </button>
        </div>
      )}
    </header>
  );
}

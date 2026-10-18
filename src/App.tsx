import { useCallback, useEffect, useState } from 'react';
import './index.css';
import { AppProvider, useAppState } from './store/context';
import { UploadZone } from './components/UploadZone';
import { DocumentViewer } from './components/DocumentViewer';
import { FieldPanel } from './components/FieldPanel';
import { EditLog } from './components/EditLog';
import { Toolbar } from './components/Toolbar';
import { DrawLayer } from './components/DrawLayer';
import { exportReviewJson } from './lib/export';
import { useLocalStoragePersistence } from './hooks/useLocalStorage';
import { saveFileContent } from './lib/fileStorage';
import type { Field, LogEntry, BoundingBox, LoadedFile } from './types';

function InvoiceApp() {
  const { state, dispatch } = useAppState();

  // ── Session restore ────────────────────────────────────────────────────────
  const handleRestoreLastSession = useCallback(
    (file: LoadedFile, saved: { fields: Field[]; log: LogEntry[] }, contentUnavailable: boolean) => {
      dispatch({ type: 'LOAD_FILE', payload: file });
      queueMicrotask(() => {
        dispatch({ type: 'RESTORE_SESSION', payload: { fields: saved.fields, log: saved.log } });
        if (contentUnavailable) {
          dispatch({ type: 'SET_CONTENT_UNAVAILABLE' });
        }
      });
    },
    [dispatch],
  );

  useLocalStoragePersistence(state.file, state.fields, state.log, handleRestoreLastSession);

  // ── Global Escape key → clear active field selection ───────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_ACTIVE', payload: null });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  // ── File upload handlers ───────────────────────────────────────────────────
  const saveAndDispatch = useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      const kind = file.type === 'application/pdf' ? 'pdf' : 'image';
      dispatch({
        type: 'LOAD_FILE',
        payload: { name: file.name, url, kind, size: file.size },
      });
      // Persist file bytes for reload recovery (best-effort, don't await in hot path)
      file.arrayBuffer().then((buf) => saveFileContent(file.name, file.size, buf)).catch(() => {});
    },
    [dispatch],
  );

  const handleFileAccepted = useCallback(
    (file: File) => { saveAndDispatch(file); },
    [saveAndDispatch],
  );

  const handleLoadSample = useCallback(() => {
    dispatch({ type: 'LOAD_SAMPLE' });
  }, [dispatch]);

  const handleReplaceFile = useCallback(
    (file: File) => { saveAndDispatch(file); },
    [saveAndDispatch],
  );

  const handleAddCustomField = useCallback(
    (field: { key: string; label: string; value: string; box: BoundingBox }) => {
      dispatch({ type: 'ADD_CUSTOM_FIELD', payload: field });
    },
    [dispatch],
  );

  const handleUpdateBox = useCallback(
    (key: string, box: BoundingBox) => {
      dispatch({ type: 'UPDATE_BOX', payload: { key, box } });
    },
    [dispatch],
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportJson = useCallback(() => {
    exportReviewJson(state);
    setToastMessage('Invoice metadata exported as JSON');
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [state]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!state.file) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50">
        <UploadZone
          onFileAccepted={handleFileAccepted}
          onLoadSample={handleLoadSample}
        />
        <footer className="w-full border-t border-neutral-200/80 bg-white/60 py-3.5 px-4 text-xs text-neutral-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p>
              <strong className="text-neutral-700 font-semibold">Invoice Review</strong> &middot; Built for the Offset take-home
            </p>
            <p className="flex items-center gap-3">
              <span className="text-neutral-400">Demo mode &middot; Mock extraction</span>
              <a
                href="https://github.com/anasamin822-dotcom/invoice-review"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 font-medium"
              >
                GitHub
              </a>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Toolbar
          fileName={state.file.name}
          drawMode={state.drawMode}
          onToggleDrawMode={() => dispatch({ type: 'TOGGLE_DRAW_MODE' })}
          onExportJson={handleExportJson}
          onReplaceFile={handleReplaceFile}
          onLoadSample={handleLoadSample}
        />

        <main className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-5 p-3 sm:p-5 max-w-[1600px] mx-auto w-full">
          <section
            className="flex-1 lg:w-[62%] min-h-[460px] lg:min-h-0"
            aria-label="Document viewer"
          >
            <DocumentViewer
              file={state.file}
              fields={state.fields}
              activeFieldKey={state.activeFieldKey}
              onSelectField={(key) => dispatch({ type: 'SET_ACTIVE', payload: key })}
              onClearSelection={() => dispatch({ type: 'SET_ACTIVE', payload: null })}
              contentUnavailable={state.contentUnavailable}
              onReupload={handleReplaceFile}
              drawMode={state.drawMode}
            >
              {state.drawMode && (
                <DrawLayer
                  fields={state.fields}
                  onAddCustomField={handleAddCustomField}
                  onUpdateFieldBox={handleUpdateBox}
                  onCancel={() => dispatch({ type: 'TOGGLE_DRAW_MODE' })}
                />
              )}
            </DocumentViewer>
          </section>

          <aside
            className="w-full lg:w-[38%] flex flex-col gap-4"
            aria-label="Review panel"
          >
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
              <FieldPanel
                fields={state.fields}
                activeFieldKey={state.activeFieldKey}
                onSelectField={(key) => dispatch({ type: 'SET_ACTIVE', payload: key })}
                onApproveField={(key) => dispatch({ type: 'APPROVE_FIELD', payload: { key } })}
                onEditField={(key, newValue) => dispatch({ type: 'EDIT_FIELD', payload: { key, newValue } })}
                onDeleteCustomField={(key) => dispatch({ type: 'DELETE_CUSTOM_FIELD', payload: { key } })}
              />
            </div>
            <EditLog entries={state.log} />
          </aside>
        </main>
      </div>

      {/* Non-blocking Success Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 pointer-events-none"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2.5 bg-neutral-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
              </svg>
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Minimal Footer (Footer.design inspired) */}
      <footer className="w-full border-t border-neutral-200/80 bg-white/70 backdrop-blur-xs py-3 px-4 sm:px-6 text-xs text-neutral-500 mt-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            <strong className="text-neutral-800 font-semibold">Invoice Review</strong> &middot; Built for the Offset take-home
          </p>
          <p className="flex items-center gap-3">
            <span className="text-neutral-400">Demo mode &middot; Mock extraction</span>
            <a
              href="https://github.com/anasamin822-dotcom/invoice-review"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2 font-medium"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <InvoiceApp />
    </AppProvider>
  );
}

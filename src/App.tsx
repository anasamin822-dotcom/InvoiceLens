import { useCallback, useEffect } from 'react';
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
import type { Field, LogEntry, BoundingBox, LoadedFile } from './types';

function InvoiceApp() {
  const { state, dispatch } = useAppState();

  // Restore last session on mount
  const handleRestoreLastSession = useCallback(
    (file: LoadedFile, saved: { fields: Field[]; log: LogEntry[] }) => {
      dispatch({ type: 'LOAD_FILE', payload: file });
      // Use a microtask so LOAD_FILE sets the file first, then we patch fields+log
      queueMicrotask(() => {
        dispatch({ type: 'RESTORE_SESSION', payload: { fields: saved.fields, log: saved.log } });
      });
    },
    [dispatch],
  );

  useLocalStoragePersistence(state.file, state.fields, state.log, handleRestoreLastSession);

  // Global Escape key → clear active field selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_ACTIVE', payload: null });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  const handleFileAccepted = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const kind = file.type === 'application/pdf' ? 'pdf' : 'image';
      dispatch({
        type: 'LOAD_FILE',
        payload: { name: file.name, url, kind, size: file.size },
      });
    },
    [dispatch],
  );

  const handleLoadSample = useCallback(() => {
    dispatch({ type: 'LOAD_SAMPLE' });
  }, [dispatch]);

  const handleReplaceFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const kind = file.type === 'application/pdf' ? 'pdf' : 'image';
      dispatch({
        type: 'LOAD_FILE',
        payload: { name: file.name, url, kind, size: file.size },
      });
    },
    [dispatch],
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

  // No file loaded yet — show upload screen
  if (!state.file) {
    return (
      <UploadZone
        onFileAccepted={handleFileAccepted}
        onLoadSample={handleLoadSample}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-neutral-50 flex flex-col"
    >
      {/* Sticky top toolbar */}
      <Toolbar
        fileName={state.file.name}
        drawMode={state.drawMode}
        onToggleDrawMode={() => dispatch({ type: 'TOGGLE_DRAW_MODE' })}
        onExportJson={() => exportReviewJson(state)}
        onReplaceFile={handleReplaceFile}
        onLoadSample={handleLoadSample}
      />

      {/* Main layout: viewer (left ~60%) + panel (right ~40%) */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 sm:p-5 max-w-[1600px] mx-auto w-full">
        {/* Document Viewer */}
        <section
          className="flex-1 lg:w-[62%] min-h-[400px] lg:min-h-0"
          aria-label="Document viewer"
        >
          <DocumentViewer
            file={state.file}
            fields={state.fields}
            activeFieldKey={state.activeFieldKey}
            onSelectField={(key) =>
              dispatch({ type: 'SET_ACTIVE', payload: key })
            }
            onClearSelection={() =>
              dispatch({ type: 'SET_ACTIVE', payload: null })
            }
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

        {/* Right sidebar: Field Panel + Edit Log */}
        <aside
          className="w-full lg:w-[38%] flex flex-col gap-4"
          aria-label="Review panel"
        >
          {/* Field cards */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
            <FieldPanel
              fields={state.fields}
              activeFieldKey={state.activeFieldKey}
              onSelectField={(key) =>
                dispatch({ type: 'SET_ACTIVE', payload: key })
              }
              onApproveField={(key) =>
                dispatch({ type: 'APPROVE_FIELD', payload: { key } })
              }
              onEditField={(key, newValue) =>
                dispatch({ type: 'EDIT_FIELD', payload: { key, newValue } })
              }
              onDeleteCustomField={(key) =>
                dispatch({ type: 'DELETE_CUSTOM_FIELD', payload: { key } })
              }
            />
          </div>

          {/* Edit log — always visible */}
          <EditLog entries={state.log} />
        </aside>
      </main>
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

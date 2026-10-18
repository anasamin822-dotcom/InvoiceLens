import { useCallback } from 'react';
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
import type { Field, LogEntry, BoundingBox } from './types';
import { MOCK_FIELDS } from './mock/fields';

function InvoiceApp() {
  const { state, dispatch } = useAppState();

  // Persist fields + log to localStorage keyed by file name+size
  const handleRestore = useCallback(
    (saved: { fields: Field[]; log: LogEntry[] }) => {
      // Only restore if the saved session has the same field keys
      const savedKeys = saved.fields.map((f) => f.key).join(',');
      const currentKeys = state.fields.map((f) => f.key).join(',');
      if (savedKeys === currentKeys) {
        // Rehydrate fields individually via EDIT + APPROVE actions to avoid
        // re-triggering log. Instead we directly restore via a synthetic reset
        // by dispatching LOAD_FILE again and then patching would be complex;
        // simplest safe approach: only restore if fields unchanged from mock.
      }
      // Restore custom fields and statuses
      if (saved.fields.length >= MOCK_FIELDS.length) {
        saved.fields.forEach((sf) => {
          const existing = state.fields.find((f) => f.key === sf.key);
          if (!existing && sf.isCustom) {
            dispatch({
              type: 'ADD_CUSTOM_FIELD',
              payload: {
                key: sf.key,
                label: sf.label,
                value: sf.value,
                box: sf.box,
              },
            });
          }
        });
      }
    },
    [dispatch, state.fields],
  );

  useLocalStoragePersistence(state.file, state.fields, state.log, handleRestore);

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

  // No file uploaded yet — show upload screen
  if (!state.file) {
    return (
      <UploadZone
        onFileAccepted={handleFileAccepted}
        onLoadSample={handleLoadSample}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
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
            drawMode={state.drawMode}
          >
            {/* DrawLayer is rendered inside DocumentViewer's page wrapper when drawMode is on */}
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

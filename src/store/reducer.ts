import type { AppState, Field, LogEntry } from '../types';
import { MOCK_FIELDS } from '../mock/fields';
import { generateId } from '../lib/formatting';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'LOAD_FILE'; payload: AppState['file'] }
  | { type: 'LOAD_SAMPLE' }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'APPROVE_FIELD'; payload: { key: string } }
  | { type: 'EDIT_FIELD'; payload: { key: string; newValue: string } }
  | { type: 'TOGGLE_DRAW_MODE' }
  | {
      type: 'ADD_CUSTOM_FIELD';
      payload: { key: string; label: string; value: string; box: Field['box'] };
    }
  | { type: 'DELETE_CUSTOM_FIELD'; payload: { key: string } }
  | { type: 'UPDATE_BOX'; payload: { key: string; box: Field['box'] } }
  | { type: 'RESTORE_SESSION'; payload: { fields: Field[]; log: LogEntry[] } };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const INITIAL_STATE: AppState = {
  file: null,
  fields: MOCK_FIELDS.map((f) => ({ ...f })),
  activeFieldKey: null,
  log: [],
  drawMode: false,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_FILE': {
      // Persist the last-opened file descriptor so page reload can restore it
      try {
        if (action.payload) {
          localStorage.setItem('invoice_review:last_file', JSON.stringify(action.payload));
        }
      } catch { /* ignore */ }
      return {
        ...INITIAL_STATE,
        file: action.payload,
        fields: MOCK_FIELDS.map((f) => ({ ...f })),
      };
    }

    case 'LOAD_SAMPLE': {
      const sampleFile = {
        name: 'sample-invoice.svg',
        url: '/sample-invoice.svg',
        kind: 'image' as const,
        size: 0,
      };
      // Track sample as last opened file too
      try {
        localStorage.setItem('invoice_review:last_file', JSON.stringify(sampleFile));
      } catch { /* ignore */ }
      return {
        ...INITIAL_STATE,
        file: sampleFile,
        fields: MOCK_FIELDS.map((f) => ({ ...f })),
      };
    }

    case 'SET_ACTIVE': {
      return { ...state, activeFieldKey: action.payload };
    }

    case 'APPROVE_FIELD': {
      const field = state.fields.find((f) => f.key === action.payload.key);
      if (!field || field.status === 'approved') return state;

      const entry: LogEntry = {
        id: generateId(),
        fieldKey: field.key,
        fieldLabel: field.label,
        type: 'approve',
        timestamp: Date.now(),
      };

      return {
        ...state,
        fields: state.fields.map((f) =>
          f.key === action.payload.key ? { ...f, status: 'approved' } : f,
        ),
        log: [entry, ...state.log],
      };
    }

    case 'EDIT_FIELD': {
      const field = state.fields.find((f) => f.key === action.payload.key);
      if (!field) return state;
      // Do not log if value did not change
      if (field.value === action.payload.newValue) return state;

      const entry: LogEntry = {
        id: generateId(),
        fieldKey: field.key,
        fieldLabel: field.label,
        type: 'edit',
        oldValue: field.value,
        newValue: action.payload.newValue,
        timestamp: Date.now(),
      };

      return {
        ...state,
        fields: state.fields.map((f) =>
          f.key === action.payload.key
            ? { ...f, value: action.payload.newValue, status: 'edited' }
            : f,
        ),
        log: [entry, ...state.log],
      };
    }

    case 'TOGGLE_DRAW_MODE': {
      return { ...state, drawMode: !state.drawMode };
    }

    case 'ADD_CUSTOM_FIELD': {
      const newField: Field = {
        key: action.payload.key,
        label: action.payload.label,
        value: action.payload.value,
        status: 'pending',
        box: action.payload.box,
        isCustom: true,
      };
      const entry: LogEntry = {
        id: generateId(),
        fieldKey: action.payload.key,
        fieldLabel: action.payload.label,
        type: 'box-draw',
        newValue: action.payload.value,
        timestamp: Date.now(),
      };
      return {
        ...state,
        fields: [...state.fields, newField],
        log: [entry, ...state.log],
        drawMode: false,
      };
    }

    case 'DELETE_CUSTOM_FIELD': {
      const field = state.fields.find((f) => f.key === action.payload.key);
      if (!field) return state;
      const entry: LogEntry = {
        id: generateId(),
        fieldKey: field.key,
        fieldLabel: field.label,
        type: 'box-delete',
        oldValue: field.value,
        timestamp: Date.now(),
      };
      return {
        ...state,
        fields: state.fields.filter((f) => f.key !== action.payload.key),
        activeFieldKey:
          state.activeFieldKey === action.payload.key
            ? null
            : state.activeFieldKey,
        log: [entry, ...state.log],
      };
    }

    case 'UPDATE_BOX': {
      return {
        ...state,
        fields: state.fields.map((f) =>
          f.key === action.payload.key ? { ...f, box: action.payload.box } : f,
        ),
      };
    }

    case 'RESTORE_SESSION': {
      // Atomically replace fields + log; used on page reload to recover saved work
      return {
        ...state,
        fields: action.payload.fields,
        log: action.payload.log,
      };
    }

    default:
      return state;
  }
}

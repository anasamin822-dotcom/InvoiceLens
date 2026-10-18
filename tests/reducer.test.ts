import { describe, it, expect } from 'vitest';
import { appReducer, INITIAL_STATE, type Action } from '../src/store/reducer';
import { MOCK_FIELDS } from '../src/mock/fields';

describe('appReducer — LOAD_FILE', () => {
  it('sets file and resets fields to mock', () => {
    const filePayload = {
      name: 'test.pdf',
      url: 'blob:test',
      kind: 'pdf' as const,
      size: 1000,
    };
    const state = appReducer(INITIAL_STATE, {
      type: 'LOAD_FILE',
      payload: filePayload,
    });
    expect(state.file).toEqual(filePayload);
    expect(state.fields).toHaveLength(MOCK_FIELDS.length);
    expect(state.log).toHaveLength(0);
    expect(state.activeFieldKey).toBeNull();
  });
});

describe('appReducer — LOAD_SAMPLE', () => {
  it('loads sample invoice file and resets fields', () => {
    const state = appReducer(INITIAL_STATE, { type: 'LOAD_SAMPLE' });
    expect(state.file?.name).toBe('sample-invoice.svg');
    expect(state.file?.kind).toBe('image');
    expect(state.fields).toHaveLength(MOCK_FIELDS.length);
  });
});

describe('appReducer — SET_ACTIVE', () => {
  it('sets the active field key', () => {
    const state = appReducer(INITIAL_STATE, {
      type: 'SET_ACTIVE',
      payload: 'invoiceNumber',
    });
    expect(state.activeFieldKey).toBe('invoiceNumber');
  });

  it('clears active key when set to null', () => {
    const withActive = { ...INITIAL_STATE, activeFieldKey: 'total' };
    const state = appReducer(withActive, { type: 'SET_ACTIVE', payload: null });
    expect(state.activeFieldKey).toBeNull();
  });
});

describe('appReducer — APPROVE_FIELD', () => {
  it('approves a pending field and appends a log entry', () => {
    const state = appReducer(INITIAL_STATE, {
      type: 'APPROVE_FIELD',
      payload: { key: 'invoiceNumber' },
    });
    const field = state.fields.find((f) => f.key === 'invoiceNumber');
    expect(field?.status).toBe('approved');
    expect(state.log).toHaveLength(1);
    expect(state.log[0].type).toBe('approve');
    expect(state.log[0].fieldKey).toBe('invoiceNumber');
  });

  it('is idempotent — does not add duplicate log entry', () => {
    let state = appReducer(INITIAL_STATE, {
      type: 'APPROVE_FIELD',
      payload: { key: 'invoiceNumber' },
    });
    state = appReducer(state, {
      type: 'APPROVE_FIELD',
      payload: { key: 'invoiceNumber' },
    });
    expect(state.log).toHaveLength(1); // no duplicate
  });
});

describe('appReducer — EDIT_FIELD', () => {
  it('edits a field value and appends a log entry', () => {
    const state = appReducer(INITIAL_STATE, {
      type: 'EDIT_FIELD',
      payload: { key: 'invoiceNumber', newValue: 'INV-9999' },
    });
    const field = state.fields.find((f) => f.key === 'invoiceNumber');
    expect(field?.value).toBe('INV-9999');
    expect(field?.status).toBe('edited');
    expect(state.log).toHaveLength(1);
    expect(state.log[0].oldValue).toBe('INV-2041');
    expect(state.log[0].newValue).toBe('INV-9999');
    expect(state.log[0].type).toBe('edit');
  });

  it('does not append log entry when value is unchanged', () => {
    const state = appReducer(INITIAL_STATE, {
      type: 'EDIT_FIELD',
      payload: { key: 'invoiceNumber', newValue: 'INV-2041' },
    });
    expect(state.log).toHaveLength(0);
  });

  it('log is ordered newest-first', () => {
    let state = appReducer(INITIAL_STATE, {
      type: 'EDIT_FIELD',
      payload: { key: 'invoiceNumber', newValue: 'INV-AAA' },
    });
    state = appReducer(state, {
      type: 'EDIT_FIELD',
      payload: { key: 'invoiceDate', newValue: '2027-01-01' },
    });
    expect(state.log[0].fieldKey).toBe('invoiceDate');
    expect(state.log[1].fieldKey).toBe('invoiceNumber');
  });
});

describe('appReducer — TOGGLE_DRAW_MODE', () => {
  it('toggles drawMode on and off', () => {
    const on = appReducer(INITIAL_STATE, { type: 'TOGGLE_DRAW_MODE' });
    expect(on.drawMode).toBe(true);
    const off = appReducer(on, { type: 'TOGGLE_DRAW_MODE' });
    expect(off.drawMode).toBe(false);
  });
});

describe('appReducer — ADD_CUSTOM_FIELD / DELETE_CUSTOM_FIELD', () => {
  const customPayload = {
    key: 'custom_test',
    label: 'Tax Amount',
    value: '1200.00',
    box: { x: 0.1, y: 0.1, w: 0.2, h: 0.05 },
  };

  it('adds a custom field and logs it', () => {
    const state = appReducer(INITIAL_STATE, {
      type: 'ADD_CUSTOM_FIELD',
      payload: customPayload,
    });
    const field = state.fields.find((f) => f.key === 'custom_test');
    expect(field).toBeDefined();
    expect(field?.isCustom).toBe(true);
    expect(state.log[0].type).toBe('box-draw');
    // Draw mode should be turned off after adding
    expect(state.drawMode).toBe(false);
  });

  it('deletes a custom field and logs it', () => {
    let state = appReducer(INITIAL_STATE, {
      type: 'ADD_CUSTOM_FIELD',
      payload: customPayload,
    });
    state = appReducer(state, {
      type: 'DELETE_CUSTOM_FIELD',
      payload: { key: 'custom_test' },
    });
    expect(state.fields.find((f) => f.key === 'custom_test')).toBeUndefined();
    expect(state.log[0].type).toBe('box-delete');
  });

  it('clears active key when active custom field is deleted', () => {
    let state = appReducer(INITIAL_STATE, {
      type: 'ADD_CUSTOM_FIELD',
      payload: customPayload,
    });
    state = appReducer(state, {
      type: 'SET_ACTIVE',
      payload: 'custom_test',
    });
    state = appReducer(state, {
      type: 'DELETE_CUSTOM_FIELD',
      payload: { key: 'custom_test' },
    });
    expect(state.activeFieldKey).toBeNull();
  });
});

describe('appReducer — UPDATE_BOX', () => {
  it('updates a field bounding box without a log entry', () => {
    const newBox = { x: 0.5, y: 0.5, w: 0.1, h: 0.1 };
    const state = appReducer(INITIAL_STATE, {
      type: 'UPDATE_BOX',
      payload: { key: 'total', box: newBox },
    });
    const field = state.fields.find((f) => f.key === 'total');
    expect(field?.box).toEqual(newBox);
    // UPDATE_BOX doesn't create a log entry
    expect(state.log).toHaveLength(0);
  });
});

describe('appReducer — unknown action', () => {
  it('returns state unchanged for unknown action', () => {
    // Cast to bypass TS to test JS runtime safety
    const result = appReducer(INITIAL_STATE, { type: 'UNKNOWN' } as unknown as Action);
    expect(result).toBe(INITIAL_STATE);
  });
});

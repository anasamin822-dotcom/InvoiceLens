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

describe('appReducer — RESTORE_SESSION', () => {
  const savedFields = [
    { key: 'invoiceNumber', label: 'Invoice Number', value: 'INV-9999', status: 'edited' as const, box: { x: 0.58, y: 0.08, w: 0.24, h: 0.04 } },
    { key: 'invoiceDate',   label: 'Invoice Date',   value: '2027-01-01', status: 'approved' as const, box: { x: 0.58, y: 0.13, w: 0.24, h: 0.04 } },
    { key: 'total',         label: 'Total Amount',   value: '99,999.00', status: 'pending' as const, box: { x: 0.58, y: 0.824, w: 0.24, h: 0.04 } },
  ];
  const savedLog = [
    { id: 'a1', fieldKey: 'invoiceNumber', fieldLabel: 'Invoice Number', type: 'edit' as const, oldValue: 'INV-2041', newValue: 'INV-9999', timestamp: 1000 },
    { id: 'a2', fieldKey: 'invoiceDate', fieldLabel: 'Invoice Date', type: 'approve' as const, timestamp: 999 },
  ];

  it('replaces fields and log atomically', () => {
    // Start with a file already loaded
    const withFile = appReducer(INITIAL_STATE, {
      type: 'LOAD_FILE',
      payload: { name: 'inv.pdf', url: 'blob:x', kind: 'pdf', size: 12345 },
    });
    const restored = appReducer(withFile, {
      type: 'RESTORE_SESSION',
      payload: { fields: savedFields, log: savedLog },
    });

    expect(restored.fields).toEqual(savedFields);
    expect(restored.log).toEqual(savedLog);
  });

  it('preserves the current file reference', () => {
    const filePayload = { name: 'inv.pdf', url: 'blob:x', kind: 'pdf' as const, size: 12345 };
    const withFile = appReducer(INITIAL_STATE, { type: 'LOAD_FILE', payload: filePayload });
    const restored = appReducer(withFile, {
      type: 'RESTORE_SESSION',
      payload: { fields: savedFields, log: savedLog },
    });

    expect(restored.file).toEqual(filePayload);
  });

  it('does not mutate drawMode or activeFieldKey', () => {
    const withActive = { ...INITIAL_STATE, activeFieldKey: 'total', drawMode: true };
    const restored = appReducer(withActive, {
      type: 'RESTORE_SESSION',
      payload: { fields: savedFields, log: savedLog },
    });
    // Restore preserves other state slices unchanged
    expect(restored.activeFieldKey).toBe('total');
    expect(restored.drawMode).toBe(true);
  });

  it('restores custom fields correctly', () => {
    const customField = {
      key: 'custom_abc',
      label: 'Tax',
      value: '500.00',
      status: 'pending' as const,
      box: { x: 0.1, y: 0.1, w: 0.2, h: 0.05 },
      isCustom: true,
    };
    const restored = appReducer(INITIAL_STATE, {
      type: 'RESTORE_SESSION',
      payload: { fields: [...savedFields, customField], log: [] },
    });
    const found = restored.fields.find((f) => f.key === 'custom_abc');
    expect(found?.isCustom).toBe(true);
    expect(found?.value).toBe('500.00');
  });

  it('restores an empty log without error', () => {
    const restored = appReducer(INITIAL_STATE, {
      type: 'RESTORE_SESSION',
      payload: { fields: savedFields, log: [] },
    });
    expect(restored.log).toHaveLength(0);
    expect(restored.fields).toHaveLength(3);
  });
});

describe('appReducer — SET_CONTENT_UNAVAILABLE', () => {
  it('sets contentUnavailable to true', () => {
    const state = appReducer(INITIAL_STATE, { type: 'SET_CONTENT_UNAVAILABLE' });
    expect(state.contentUnavailable).toBe(true);
  });

  it('preserves all other state slices', () => {
    const withLog = appReducer(INITIAL_STATE, {
      type: 'EDIT_FIELD',
      payload: { key: 'invoiceNumber', newValue: 'INV-XXXX' },
    });
    const state = appReducer(withLog, { type: 'SET_CONTENT_UNAVAILABLE' });
    expect(state.contentUnavailable).toBe(true);
    expect(state.log).toHaveLength(1);
    expect(state.fields.find((f) => f.key === 'invoiceNumber')?.value).toBe('INV-XXXX');
  });

  it('is cleared by LOAD_FILE', () => {
    const unavailable = appReducer(INITIAL_STATE, { type: 'SET_CONTENT_UNAVAILABLE' });
    expect(unavailable.contentUnavailable).toBe(true);
    const loaded = appReducer(unavailable, {
      type: 'LOAD_FILE',
      payload: { name: 'new.pdf', url: 'blob:new', kind: 'pdf', size: 100 },
    });
    expect(loaded.contentUnavailable).toBe(false);
  });

  it('is cleared by LOAD_SAMPLE', () => {
    const unavailable = appReducer(INITIAL_STATE, { type: 'SET_CONTENT_UNAVAILABLE' });
    const loaded = appReducer(unavailable, { type: 'LOAD_SAMPLE' });
    expect(loaded.contentUnavailable).toBe(false);
  });

  it('INITIAL_STATE has contentUnavailable = false', () => {
    expect(INITIAL_STATE.contentUnavailable).toBe(false);
  });
});



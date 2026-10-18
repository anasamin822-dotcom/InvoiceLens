import type { AppState } from '../types';

/** Download reviewed fields and audit log as a formatted JSON file. */
export function exportReviewJson(state: AppState) {
  const exportData = {
    document: {
      name: state.file?.name || 'unknown',
      kind: state.file?.kind || 'unknown',
      exportedAt: new Date().toISOString(),
    },
    fields: state.fields.map((f) => ({
      key: f.key,
      label: f.label,
      value: f.value,
      status: f.status,
      box: f.box,
      isCustom: Boolean(f.isCustom),
    })),
    auditLog: state.log.map((entry) => ({
      id: entry.id,
      fieldKey: entry.fieldKey,
      fieldLabel: entry.fieldLabel,
      type: entry.type,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      timestamp: entry.timestamp,
      formattedTime: new Date(entry.timestamp).toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (state.file?.name || 'invoice').replace(/\.[^/.]+$/, '');
  a.href = url;
  a.download = `${safeName}-review-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

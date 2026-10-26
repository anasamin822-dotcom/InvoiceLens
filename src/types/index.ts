export type FieldKey = 'invoiceNumber' | 'invoiceDate' | 'total';

export interface BoundingBox {
  /** Normalised 0–1 relative to rendered page width */
  x: number;
  /** Normalised 0–1 relative to rendered page height */
  y: number;
  w: number;
  h: number;
}

export interface Field {
  page?: number;
  source?: 'pdf-text' | 'ocr' | 'manual' | 'sample';
  confidence?: number;
  key: FieldKey | string;
  label: string;
  value: string;
  status: 'pending' | 'approved' | 'edited';
  box: BoundingBox;
  isCustom?: boolean;
}

export type LogEntryType = 'edit' | 'approve' | 'box-draw' | 'box-delete';

export interface LogEntry {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  type: LogEntryType;
  oldValue?: string;
  newValue?: string;
  timestamp: number;
}

export interface LoadedFile {
  name: string;
  url: string;
  kind: 'pdf' | 'image';
  size: number;
}

export interface AppState {
  file: LoadedFile | null;
  fields: Field[];
  activeFieldKey: string | null;
  log: LogEntry[];
  drawMode: boolean;
  /** True when a blob: URL was restored but the file bytes are no longer available */
  contentUnavailable: boolean;
}

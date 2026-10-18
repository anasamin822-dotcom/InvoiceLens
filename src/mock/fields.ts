import type { Field } from '../types';

/** Mock fields with plausible normalised bounding boxes. */
export const MOCK_FIELDS: Field[] = [
  {
    key: 'invoiceNumber',
    label: 'Invoice Number',
    value: 'INV-2041',
    status: 'pending',
    box: { x: 0.58, y: 0.08, w: 0.24, h: 0.04 },
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    value: '2026-09-14',
    status: 'pending',
    box: { x: 0.58, y: 0.13, w: 0.24, h: 0.04 },
  },
  {
    key: 'total',
    label: 'Total Amount',
    value: '48,250.00',
    status: 'pending',
    box: { x: 0.58, y: 0.824, w: 0.24, h: 0.04 },
  },
];

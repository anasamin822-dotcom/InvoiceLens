import { describe, it, expect } from 'vitest';
import {
  validateInvoiceNumber,
  validateDate,
  validateTotal,
  validateField,
} from '../src/lib/validation';

describe('validateInvoiceNumber', () => {
  it('passes a non-empty string', () => {
    expect(validateInvoiceNumber('INV-2041').valid).toBe(true);
  });
  it('fails empty string', () => {
    const r = validateInvoiceNumber('');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });
  it('fails whitespace-only string', () => {
    expect(validateInvoiceNumber('   ').valid).toBe(false);
  });
});

describe('validateDate', () => {
  it('passes valid ISO date', () => {
    expect(validateDate('2026-09-14').valid).toBe(true);
  });
  it('fails non-ISO format', () => {
    expect(validateDate('14/09/2026').valid).toBe(false);
  });
  it('fails invalid day for month', () => {
    expect(validateDate('2026-02-30').valid).toBe(false);
  });
  it('fails completely wrong string', () => {
    expect(validateDate('not-a-date').valid).toBe(false);
  });
  it('passes leap year date', () => {
    expect(validateDate('2024-02-29').valid).toBe(true);
  });
  it('fails non-leap year Feb 29', () => {
    expect(validateDate('2023-02-29').valid).toBe(false);
  });
});

describe('validateTotal', () => {
  it('passes integer number', () => {
    expect(validateTotal('1000').valid).toBe(true);
  });
  it('passes number with 2 decimal places', () => {
    expect(validateTotal('48250.00').valid).toBe(true);
  });
  it('passes number with commas', () => {
    expect(validateTotal('48,250.00').valid).toBe(true);
  });
  it('fails number with 3 decimal places', () => {
    expect(validateTotal('48250.001').valid).toBe(false);
  });
  it('rejects malformed grouping', () => { expect(validateTotal('1,2,3').valid).toBe(false); expect(validateTotal(',100').valid).toBe(false); });
  it('fails alpha string', () => {
    expect(validateTotal('abc').valid).toBe(false);
  });
  it('fails empty string', () => {
    expect(validateTotal('').valid).toBe(false);
  });
  it('fails negative number', () => {
    expect(validateTotal('-100.00').valid).toBe(false);
  });
});

describe('validateField', () => {
  it('routes to invoiceNumber validator', () => {
    expect(validateField('invoiceNumber', 'INV-001').valid).toBe(true);
    expect(validateField('invoiceNumber', '').valid).toBe(false);
  });
  it('routes to invoiceDate validator', () => {
    expect(validateField('invoiceDate', '2026-01-01').valid).toBe(true);
  });
  it('routes to total validator', () => {
    expect(validateField('total', '100.00').valid).toBe(true);
  });
  it('custom field: passes non-empty', () => {
    expect(validateField('custom_123', 'some value').valid).toBe(true);
  });
  it('custom field: fails empty', () => {
    expect(validateField('custom_123', '').valid).toBe(false);
  });
});

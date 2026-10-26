export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Invoice number: non-empty string. */
export function validateInvoiceNumber(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Invoice number cannot be empty.' };
  }
  return { valid: true };
}

/** Date: must be a valid YYYY-MM-DD date. */
export function validateDate(value: string): ValidationResult {
  const trimmed = value.trim();
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!ISO_RE.test(trimmed)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format.' };
  }
  const d = new Date(trimmed);
  // Date constructor accepts some invalid dates (e.g. Feb 30) silently
  if (isNaN(d.getTime())) {
    return { valid: false, error: 'Date is not a valid calendar date.' };
  }
  // Verify month/day round-trip to catch overflow like 2026-02-30
  const [y, m, day] = trimmed.split('-').map(Number);
  if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
    return { valid: false, error: 'Date is not a valid calendar date.' };
  }
  return { valid: true };
}

/** Total: valid number with optional commas and up to 2 decimal places. */
export function validateTotal(value: string): ValidationResult {
  const trimmed = value.trim();
  const NUM_RE = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;
  if (!NUM_RE.test(trimmed)) {
    return {
      valid: false,
      error: 'Total must be a valid number with up to 2 decimal places.',
    };
  }
  return { valid: true };
}

/** Dispatch to the right validator by field key. */
export function validateField(key: string, value: string): ValidationResult {
  switch (key) {
    case 'invoiceNumber':
      return validateInvoiceNumber(value);
    case 'invoiceDate':
      return validateDate(value);
    case 'total':
      return validateTotal(value);
    default:
      // Custom fields: just non-empty
      return value.trim().length > 0
        ? { valid: true }
        : { valid: false, error: 'Value cannot be empty.' };
  }
}

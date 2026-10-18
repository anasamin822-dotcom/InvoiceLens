import { useEffect } from 'react';
import type { AppState, Field, LogEntry } from '../types';

interface SavedSession {
  fields: Field[];
  log: LogEntry[];
}

/**
 * Persists fields and edit log per unique file name.
 * Automatically recovers state on page reload for the same file.
 */
export function useLocalStoragePersistence(
  file: AppState['file'],
  fields: Field[],
  log: LogEntry[],
  onRestore: (saved: SavedSession) => void,
) {
  // Load saved state when file changes
  useEffect(() => {
    if (!file) return;
    try {
      const storageKey = `invoice_review:${file.name}:${file.size}`;
      const serialized = localStorage.getItem(storageKey);
      if (serialized) {
        const parsed = JSON.parse(serialized) as SavedSession;
        if (Array.isArray(parsed.fields) && Array.isArray(parsed.log)) {
          onRestore(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not read from localStorage:', err);
    }
  }, [file?.name, file?.size, onRestore]);

  // Persist state updates when fields or log change
  useEffect(() => {
    if (!file) return;
    try {
      const storageKey = `invoice_review:${file.name}:${file.size}`;
      const payload: SavedSession = { fields, log };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }, [file?.name, file?.size, fields, log]);
}

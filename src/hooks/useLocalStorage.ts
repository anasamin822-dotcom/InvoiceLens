import { useEffect } from 'react';
import type { AppState, Field, LoadedFile, LogEntry } from '../types';

interface SavedSession {
  fields: Field[];
  log: LogEntry[];
}

const LAST_FILE_KEY = 'invoice_review:last_file';

function sessionKey(file: { name: string; size: number }) {
  return `invoice_review:${file.name}:${file.size}`;
}

/**
 * On mount, reads the last-opened file descriptor and saved session from
 * localStorage and calls onRestoreLastSession so the app can re-load
 * without the user having to re-upload.
 *
 * While a file is open, persists fields + log on every change.
 */
export function useLocalStoragePersistence(
  file: AppState['file'],
  fields: Field[],
  log: LogEntry[],
  onRestoreLastSession: (file: LoadedFile, saved: SavedSession) => void,
) {
  // ── Mount: restore last session ──────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_FILE_KEY);
      if (!raw) return;
      const lastFile = JSON.parse(raw) as LoadedFile;

      // For blob: URLs we can't reconstruct the object URL after a reload,
      // but for the sample SVG (static path) and any file whose URL is a
      // static path we can. Blob URLs will just show a broken image, which
      // is acceptable — the review state (fields/log) is still restored.
      const key = sessionKey(lastFile);
      const savedRaw = localStorage.getItem(key);
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw) as SavedSession;
      if (Array.isArray(saved.fields) && Array.isArray(saved.log)) {
        onRestoreLastSession(lastFile, saved);
      }
    } catch {
      // Silently ignore corrupt storage
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist fields + log whenever they change ────────────────────────────
  useEffect(() => {
    if (!file) return;
    try {
      const payload: SavedSession = { fields, log };
      localStorage.setItem(sessionKey(file), JSON.stringify(payload));
    } catch {
      // Silently ignore quota errors
    }
  }, [file, fields, log]);
}

import { useEffect } from 'react';
import type { AppState, Field, LoadedFile, LogEntry } from '../types';
import { loadFileContent } from '../lib/fileStorage';

interface SavedSession {
  fields: Field[];
  log: LogEntry[];
}

const LAST_FILE_KEY = 'invoice_review:last_file';

function sessionKey(file: { name: string; size: number }) {
  return `invoice_review:${file.name}:${file.size}`;
}

/** True for static paths (sample SVG and any /…path) that survive reloads as-is */
function isStaticUrl(url: string): boolean {
  return !url.startsWith('blob:') && !url.startsWith('data:');
}

/**
 * On mount, restores the last-opened session from storage.
 *
 * For static URLs (e.g. the sample SVG): restore directly.
 * For blob: URLs: attempt to re-hydrate file bytes from fileStorage;
 *   - on success: call onRestoreLastSession with a new object-URL
 *   - on failure: call onRestoreLastSession with the dead blob URL (viewer will
 *     detect and signal content unavailable) and pass contentUnavailable=true
 *
 * While open, persists fields + log on every change.
 */
export function useLocalStoragePersistence(
  file: AppState['file'],
  fields: Field[],
  log: LogEntry[],
  onRestoreLastSession: (file: LoadedFile, saved: SavedSession, contentUnavailable: boolean) => void,
) {
  // ── Mount: restore last session ──────────────────────────────────────────
  useEffect(() => {
    async function tryRestore() {
      try {
        const raw = localStorage.getItem(LAST_FILE_KEY);
        if (!raw) return;
        const lastFile = JSON.parse(raw) as LoadedFile;

        const key = sessionKey(lastFile);
        const savedRaw = localStorage.getItem(key);
        if (!savedRaw) return;
        const saved = JSON.parse(savedRaw) as SavedSession;
        if (!Array.isArray(saved.fields) || !Array.isArray(saved.log)) return;

        if (isStaticUrl(lastFile.url)) {
          // Static URL always works — restore directly
          onRestoreLastSession(lastFile, saved, false);
          return;
        }

        // Blob URL — attempt to re-hydrate from fileStorage
        const buffer = await loadFileContent(lastFile.name, lastFile.size);
        if (buffer) {
          const mimeType = lastFile.kind === 'pdf' ? 'application/pdf' : 'image/*';
          const blob = new Blob([buffer], { type: mimeType });
          const newUrl = URL.createObjectURL(blob);
          onRestoreLastSession({ ...lastFile, url: newUrl }, saved, false);
        } else {
          // Content not available — restore review state but flag the viewer
          onRestoreLastSession(lastFile, saved, true);
        }
      } catch {
        // Silently ignore corrupt storage
      }
    }

    tryRestore();
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

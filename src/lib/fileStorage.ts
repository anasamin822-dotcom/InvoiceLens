/**
 * fileStorage.ts
 *
 * Persists uploaded file bytes across page reloads.
 *
 * Strategy:
 *  - Files ≤ MAX_LS_BYTES (4 MB) → base64 in localStorage
 *  - Files >  MAX_LS_BYTES       → ArrayBuffer in IndexedDB
 *
 * The sample SVG has a static URL ("/sample-invoice.svg") and is never stored here.
 */

const MAX_LS_BYTES = 4 * 1024 * 1024; // 4 MB
const LS_PREFIX = 'invoice_review:file_data:';
const IDB_DB = 'invoice-review';
const IDB_STORE = 'files';
const IDB_VERSION = 1;

function fileDataKey(name: string, size: number): string {
  return `${name}:${size}`;
}

// ── localStorage path (small files) ─────────────────────────────────────────

function lsKey(name: string, size: number): string {
  return `${LS_PREFIX}${fileDataKey(name, size)}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── IndexedDB path (large files) ─────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSave(key: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(buffer, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbLoad(key: string): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as ArrayBuffer | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persist the raw bytes of an uploaded file.
 * Small files go to localStorage (base64), large files to IndexedDB.
 * Silently swallows errors — persistence is best-effort.
 */
export async function saveFileContent(
  name: string,
  size: number,
  buffer: ArrayBuffer,
): Promise<void> {
  try {
    if (size <= MAX_LS_BYTES) {
      localStorage.setItem(lsKey(name, size), arrayBufferToBase64(buffer));
    } else {
      await idbSave(fileDataKey(name, size), buffer);
    }
  } catch {
    // Quota exceeded or IDB unavailable — skip silently
  }
}

/**
 * Retrieve the raw bytes of a previously stored file.
 * Returns null if no data was found or on any error.
 */
export async function loadFileContent(
  name: string,
  size: number,
): Promise<ArrayBuffer | null> {
  try {
    if (size <= MAX_LS_BYTES) {
      const b64 = localStorage.getItem(lsKey(name, size));
      return b64 ? base64ToArrayBuffer(b64) : null;
    } else {
      return await idbLoad(fileDataKey(name, size));
    }
  } catch {
    return null;
  }
}

/** Exported for tests */
export { arrayBufferToBase64, base64ToArrayBuffer, MAX_LS_BYTES };

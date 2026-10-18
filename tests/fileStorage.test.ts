/**
 * fileStorage.test.ts
 *
 * Tests the localStorage path (files ≤ 4 MB).
 * The IndexedDB path requires a real IndexedDB implementation; jsdom ships with
 * a stub that throws on open, so we leave large-file IDB coverage to e2e.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFileContent,
  loadFileContent,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  MAX_LS_BYTES,
} from '../src/lib/fileStorage';

// jsdom provides localStorage; clear it before each test
beforeEach(() => {
  localStorage.clear();
});

// ── Codec round-trip ─────────────────────────────────────────────────────────

describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255, 72, 101, 108, 108, 111]);
    const b64 = arrayBufferToBase64(original.buffer);
    expect(typeof b64).toBe('string');
    const restored = new Uint8Array(base64ToArrayBuffer(b64));
    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it('handles empty buffer', () => {
    const b64 = arrayBufferToBase64(new ArrayBuffer(0));
    expect(b64).toBe('');
    const back = base64ToArrayBuffer(b64);
    expect(back.byteLength).toBe(0);
  });

  it('handles a simple ASCII string', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('Hello, Invoice Review!').buffer;
    const b64 = arrayBufferToBase64(buf);
    const decoded = new TextDecoder().decode(base64ToArrayBuffer(b64));
    expect(decoded).toBe('Hello, Invoice Review!');
  });
});

// ── Small-file (localStorage) path ────────────────────────────────────────────

describe('saveFileContent / loadFileContent — small files (≤ MAX_LS_BYTES)', () => {
  const name = 'invoice.pdf';
  const size = 512; // 512 bytes — well under 4 MB

  it('saves and loads back the same bytes', async () => {
    const original = new Uint8Array([10, 20, 30, 40, 50]);
    await saveFileContent(name, size, original.buffer);
    const loaded = await loadFileContent(name, size);
    expect(loaded).not.toBeNull();
    expect(Array.from(new Uint8Array(loaded!))).toEqual([10, 20, 30, 40, 50]);
  });

  it('returns null when nothing has been saved for that key', async () => {
    const result = await loadFileContent('nonexistent.pdf', 9999);
    expect(result).toBeNull();
  });

  it('overwrites previous data for the same name+size', async () => {
    const first = new Uint8Array([1, 2, 3]);
    const second = new Uint8Array([7, 8, 9]);
    await saveFileContent(name, size, first.buffer);
    await saveFileContent(name, size, second.buffer);
    const loaded = await loadFileContent(name, size);
    expect(Array.from(new Uint8Array(loaded!))).toEqual([7, 8, 9]);
  });

  it('stores different files independently (name+size keying)', async () => {
    const bufA = new Uint8Array([1, 1, 1]).buffer;
    const bufB = new Uint8Array([2, 2, 2]).buffer;
    await saveFileContent('a.pdf', 100, bufA);
    await saveFileContent('b.pdf', 200, bufB);

    const a = await loadFileContent('a.pdf', 100);
    const b = await loadFileContent('b.pdf', 200);
    expect(Array.from(new Uint8Array(a!))).toEqual([1, 1, 1]);
    expect(Array.from(new Uint8Array(b!))).toEqual([2, 2, 2]);
  });

  it('same name but different size treated as different files', async () => {
    await saveFileContent('inv.pdf', 100, new Uint8Array([9]).buffer);
    const result = await loadFileContent('inv.pdf', 999); // different size
    expect(result).toBeNull();
  });
});

// ── Size boundary ─────────────────────────────────────────────────────────────

describe('MAX_LS_BYTES boundary', () => {
  it('MAX_LS_BYTES is exactly 4 MB', () => {
    expect(MAX_LS_BYTES).toBe(4 * 1024 * 1024);
  });

  it('saves a file of exactly MAX_LS_BYTES to localStorage', async () => {
    // We cannot actually allocate 4 MB in a unit test easily, so we verify
    // the code path by mocking size (size param controls the path, not the buffer)
    const buf = new Uint8Array([42]).buffer;
    await saveFileContent('big.pdf', MAX_LS_BYTES, buf);
    const result = await loadFileContent('big.pdf', MAX_LS_BYTES);
    expect(Array.from(new Uint8Array(result!))).toEqual([42]);
  });
});

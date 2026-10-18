/** Format a unix timestamp (ms) to a readable local time string, e.g. "18 Oct 2026, 14:05:32" */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Generate a short random id (not crypto-secure, just for log entry keys). */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

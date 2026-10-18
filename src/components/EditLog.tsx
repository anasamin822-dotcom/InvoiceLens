import { useState } from 'react';
import type { LogEntry } from '../types';
import { formatTimestamp } from '../lib/formatting';

interface EditLogProps {
  entries: LogEntry[];
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return formatTimestamp(timestamp);
}

export function EditLog({ entries }: EditLogProps) {
  // Collapsed by default on mobile screens to preserve viewport space
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Newest events first
  const sortedEntries = [...entries].reverse();

  return (
    <div className="flex flex-col bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-neutral-500"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3Zm2 1.5v7h10v-7H3Z" />
            <path d="M5 6.5A.5.5 0 0 1 5.5 6h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Zm0 2A.5.5 0 0 1 5.5 8h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" />
          </svg>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Audit Trail</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full tabular-nums">
            {entries.length} {entries.length === 1 ? 'event' : 'events'}
          </span>

          {/* Mobile Accordion Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            aria-expanded={isMobileExpanded}
            aria-label="Toggle audit trail visibility"
            className="md:hidden inline-flex items-center justify-center p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 min-h-[44px] min-w-[44px]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-200 ${isMobileExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries list (always visible on desktop; collapsible on mobile) */}
      <div className={`mt-3 ${isMobileExpanded ? 'block' : 'hidden md:block'}`}>
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-neutral-400">
            <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-200/60 flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-neutral-300">
                <path fillRule="evenodd" d="M3.75 2a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75V2.75a.75.75 0 0 0-.75-.75h-8.5Zm0-1.5h8.5A2.25 2.25 0 0 1 14.5 2.75v10.5A2.25 2.25 0 0 1 12.25 15h-8.5A2.25 2.25 0 0 1 1.5 12.75V2.75A2.25 2.25 0 0 1 3.75.5Z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-neutral-600">No edits recorded</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Approved or modified values will appear here.</p>
          </div>
        ) : (
          <div className="relative pl-3.5 pr-1 max-h-[320px] overflow-y-auto space-y-3.5 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-200">
            {sortedEntries.map((item) => (
              <div key={item.id} className="relative flex items-start gap-3 text-xs">
                {/* Timeline status dot */}
                <span
                  className={[
                    'relative z-10 mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-3',
                    item.type === 'approve' && 'bg-emerald-500 ring-emerald-50',
                    item.type === 'edit' && 'bg-amber-500 ring-amber-50',
                    item.type === 'box-draw' && 'bg-purple-500 ring-purple-50',
                    item.type === 'box-delete' && 'bg-red-500 ring-red-50',
                  ].filter(Boolean).join(' ')}
                  aria-hidden="true"
                />

                <div className="flex-1 min-w-0 bg-neutral-50/70 border border-neutral-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-neutral-800 truncate">{item.fieldLabel}</span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0 tabular-nums" title={formatTimestamp(item.timestamp)}>
                      {getRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  {item.type === 'approve' && (
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Approved current value
                    </p>
                  )}

                  {item.type === 'edit' && (
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <span className="text-[9px] uppercase font-bold text-neutral-400">Old:</span>
                        <span className="line-through font-mono text-neutral-500 truncate tabular-nums">{item.oldValue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                        <span className="text-[9px] uppercase font-bold text-indigo-600">New:</span>
                        <span className="font-mono text-indigo-700 truncate tabular-nums">{item.newValue}</span>
                      </div>
                    </div>
                  )}

                  {item.type === 'box-draw' && (
                    <p className="text-[11px] text-purple-700 font-medium">
                      Added custom field: <span className="font-mono font-semibold">{item.newValue}</span>
                    </p>
                  )}

                  {item.type === 'box-delete' && (
                    <p className="text-[11px] text-red-700 font-medium">
                      Removed custom field: <span className="font-mono">{item.oldValue}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

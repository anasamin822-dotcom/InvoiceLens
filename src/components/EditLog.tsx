import type { LogEntry } from '../types';
import { formatTimestamp } from '../lib/formatting';

interface EditLogProps {
  entries: LogEntry[];
}

export function EditLog({ entries }: EditLogProps) {
  return (
    <div className="flex flex-col h-full bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-neutral-500" aria-hidden="true">
            <path fillRule="evenodd" d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3Zm2 1.5v7h10v-7H3Z" />
            <path d="M5 6.5A.5.5 0 0 1 5.5 6h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Zm0 2A.5.5 0 0 1 5.5 8h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" />
          </svg>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Audit &amp; Edit Log</h2>
        </div>
        <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
          {entries.length} {entries.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Log entries list */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-400 my-auto">
          <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-200/60 flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-neutral-300">
              <path fillRule="evenodd" d="M3.75 2a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75V2.75a.75.75 0 0 0-.75-.75h-8.5Zm0-1.5h8.5A2.25 2.25 0 0 1 14.5 2.75v10.5A2.25 2.25 0 0 1 12.25 15h-8.5A2.25 2.25 0 0 1 1.5 12.75V2.75A2.25 2.25 0 0 1 3.75.5Z" />
              <path d="M5 5.5A.5.5 0 0 1 5.5 5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 5.5Zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 8Zm0 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-neutral-500">No edits yet</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Approved or modified values will be recorded here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px] pr-1 list-none p-0 m-0 divide-y divide-neutral-100">
          {entries.map((item) => (
            <li key={item.id} className="pt-2.5 first:pt-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">{item.fieldLabel}</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>

              {item.type === 'approve' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="font-medium">Approved current value</span>
                </div>
              )}

              {item.type === 'edit' && (
                <div className="text-xs space-y-1 bg-indigo-50/40 p-2 rounded border border-indigo-100/70">
                  <div className="flex items-center gap-1 text-neutral-500">
                    <span className="text-[10px] font-semibold uppercase text-neutral-400">Old:</span>
                    <span className="line-through font-mono text-neutral-600 truncate">{item.oldValue}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-900 font-semibold">
                    <span className="text-[10px] uppercase text-indigo-500">New:</span>
                    <span className="font-mono text-indigo-700 truncate">{item.newValue}</span>
                  </div>
                </div>
              )}

              {item.type === 'box-draw' && (
                <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                  Added custom field: <span className="font-mono font-semibold">{item.newValue}</span>
                </div>
              )}

              {item.type === 'box-delete' && (
                <div className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">
                  Removed custom field: <span className="font-mono">{item.oldValue}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

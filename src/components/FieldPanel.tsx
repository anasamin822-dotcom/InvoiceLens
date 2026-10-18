import type { Field } from '../types';
import { FieldCard } from './FieldCard';

interface FieldPanelProps {
  fields: Field[];
  activeFieldKey: string | null;
  onSelectField: (key: string) => void;
  onApproveField: (key: string) => void;
  onEditField: (key: string, newValue: string) => void;
  onDeleteCustomField?: (key: string) => void;
}

export function FieldPanel({
  fields,
  activeFieldKey,
  onSelectField,
  onApproveField,
  onEditField,
  onDeleteCustomField,
}: FieldPanelProps) {
  const approvedCount = fields.filter((f) => f.status === 'approved').length;
  const editedCount = fields.filter((f) => f.status === 'edited').length;
  const pendingCount = fields.filter((f) => f.status === 'pending').length;
  const total = fields.length;
  const progressPercent = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Panel Summary Header with Animated Progress */}
      <div className="flex flex-col gap-2 pb-3 border-b border-neutral-200/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
              <span>Extracted Fields</span>
              <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full tabular-nums">
                {total}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              <span className="tabular-nums font-medium text-neutral-700">{approvedCount}</span> of{' '}
              <span className="tabular-nums font-medium text-neutral-700">{total}</span> approved
              {editedCount > 0 && (
                <span className="text-neutral-500"> &middot; {editedCount} edited</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200/70 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                <span className="tabular-nums">{pendingCount}</span> to review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/70 text-[11px]">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
                </svg>
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Aceternity-style calm animated progress bar */}
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPercent}% fields approved`}
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2.5">
        {fields.map((field) => (
          <FieldCard
            key={field.key}
            field={field}
            isActive={field.key === activeFieldKey}
            onSelect={onSelectField}
            onApprove={onApproveField}
            onEdit={onEditField}
            onDeleteCustom={onDeleteCustomField}
          />
        ))}
      </div>
    </div>
  );
}

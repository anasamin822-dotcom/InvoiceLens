import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Field } from '../types';
import { validateField } from '../lib/validation';

interface FieldCardProps {
  field: Field;
  isActive: boolean;
  onSelect: (key: string) => void;
  onApprove: (key: string) => void;
  onEdit: (key: string, newValue: string) => void;
  onDeleteCustom?: (key: string) => void;
}

export function FieldCard({
  field,
  isActive,
  onSelect,
  onApprove,
  onEdit,
  onDeleteCustom,
}: FieldCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(field.value);
  const [error, setError] = useState<string | null>(null);

  // Sync draft value if external field value changes
  useEffect(() => {
    setDraftValue(field.value);
  }, [field.value]);

  // Scroll card into view smoothly when activated from bounding box click
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Spotlight mouse-tracking effect: updates CSS variables for smooth radial glow
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleSave = () => {
    const res = validateField(field.key, draftValue);
    if (!res.valid) {
      setError(res.error || 'Invalid value.');
      return;
    }
    setError(null);
    setIsEditing(false);
    onEdit(field.key, draftValue);
  };

  const handleCancel = () => {
    setDraftValue(field.value);
    setError(null);
    setIsEditing(false);
  };

  const getStatusBadge = () => {
    switch (field.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full transition-colors duration-150">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
            </svg>
            Approved
          </span>
        );
      case 'edited':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full transition-colors duration-150">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774l-.794 3.177a.75.75 0 0 0 .914.914l3.177-.794 4.261-4.262a1.75 1.75 0 0 0 0-2.474l-.82-.822Z" />
            </svg>
            Edited
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200/80 px-2 py-0.5 rounded-full transition-colors duration-150">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" aria-hidden="true" />
            Pending
          </span>
        );
    }
  };

  return (
    <div
      ref={cardRef}
      role="region"
      aria-label={`${field.label} card`}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(field.key)}
      className={[
        'spotlight-card rounded-xl p-3.5 sm:p-4 cursor-pointer border select-none transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-xs',
        'focus-within:ring-2 focus-within:ring-indigo-500/40',
        isActive
          ? field.isCustom
            ? 'ring-2 ring-purple-500/40 border-purple-500 bg-purple-50/15 shadow-sm'
            : 'ring-2 ring-indigo-500/40 border-indigo-500 bg-indigo-50/15 shadow-sm'
          : 'border-neutral-200/80 hover:border-neutral-300 bg-white shadow-2xs',
      ].join(' ')}
    >
      {/* Card Header: Label, Badges, Delete if custom */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {field.label}
          </span>
          {field.isCustom && (
            <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {getStatusBadge()}
          {field.isCustom && onDeleteCustom && (
            <button
              type="button"
              aria-label={`Delete custom field ${field.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCustom(field.key);
              }}
              className="p-1 text-neutral-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete field"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.788l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.713Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Field Value / Inline Edit Input */}
      {isEditing ? (
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={draftValue}
              onChange={(e) => {
                setDraftValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              aria-label={`Edit value for ${field.label}`}
              className={[
                'w-full px-3 py-2 text-sm font-medium rounded-lg border bg-white focus:outline-none focus:ring-2 tabular-nums',
                error
                  ? 'border-red-400 focus:ring-red-400 text-red-900 bg-red-50/30'
                  : 'border-indigo-400 focus:ring-indigo-500 text-neutral-900',
              ].join(' ')}
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200/80 rounded-md px-2.5 py-1.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary-tactile inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer min-h-[44px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <p className="text-base font-semibold text-neutral-900 tracking-tight font-mono break-all tabular-nums">
            {field.value}
          </p>
        </div>
      )}

      {/* Action Buttons: Approve & Edit */}
      {!isEditing && (
        <div
          className="flex items-center gap-2 mt-3 pt-2.5 border-t border-neutral-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={field.status === 'approved'}
            onClick={() => onApprove(field.key)}
            aria-label={`Approve ${field.label}`}
            className={[
              'flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px]',
              field.status === 'approved'
                ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 hover:border-emerald-300 cursor-pointer active:scale-[0.99]',
            ].join(' ')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
            </svg>
            {field.status === 'approved' ? 'Approved' : 'Approve'}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${field.label}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 hover:border-neutral-300 transition-all cursor-pointer min-h-[44px] active:scale-[0.99]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774l-.794 3.177a.75.75 0 0 0 .914.914l3.177-.794 4.261-4.262a1.75 1.75 0 0 0 0-2.474l-.82-.822Z" />
            </svg>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

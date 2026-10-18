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

  return (
    <div className="flex flex-col gap-4">
      {/* Panel Summary Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
            Extracted Fields
          </h2>
          <p className="text-xs text-neutral-500">
            {approvedCount + editedCount} of {fields.length} reviewed
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60 text-[11px]">
              {pendingCount} pending
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 text-[11px]">
              All reviewed
            </span>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
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

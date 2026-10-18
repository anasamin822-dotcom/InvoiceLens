import type { Field } from '../types';

interface BoundingBoxOverlayProps {
  fields: Field[];
  activeFieldKey: string | null;
  onSelectField: (key: string) => void;
}

export function BoundingBoxOverlay({
  fields,
  activeFieldKey,
  onSelectField,
}: BoundingBoxOverlayProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-label="Document field bounding boxes"
    >
      {fields.map((field) => {
        const isActive = field.key === activeFieldKey;
        const hasActiveField = activeFieldKey !== null;

        // Bounding boxes use percentage coordinates relative to the rendered page wrapper
        const style: React.CSSProperties = {
          left: `${field.box.x * 100}%`,
          top: `${field.box.y * 100}%`,
          width: `${field.box.w * 100}%`,
          height: `${field.box.h * 100}%`,
        };

        return (
          <div
            key={field.key}
            role="button"
            tabIndex={0}
            aria-label={`${field.label}: ${field.value} (${field.status})`}
            aria-pressed={isActive}
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(field.key);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSelectField(field.key);
              }
            }}
            className={[
              'absolute rounded transition-all duration-200 pointer-events-auto cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              field.isCustom
                ? [
                    // Custom (user-drawn) boxes: dashed purple border, purple fill
                    isActive
                      ? 'border-2 border-dashed border-purple-600 bg-purple-500/20 active-box-pulse z-20 focus-visible:ring-purple-600'
                      : hasActiveField
                        ? 'border border-dashed border-purple-400/60 bg-purple-50/10 opacity-50 hover:opacity-100 hover:border-purple-500 z-10 focus-visible:ring-purple-500'
                        : 'border border-dashed border-purple-500/80 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-600 z-10 focus-visible:ring-purple-500',
                  ].join('')
                : [
                    // Extracted (mock) boxes: solid indigo border, indigo fill
                    isActive
                      ? 'border-2 border-indigo-600 bg-indigo-500/20 active-box-pulse z-20 focus-visible:ring-indigo-600'
                      : hasActiveField
                        ? 'border border-indigo-300/60 bg-indigo-50/10 opacity-50 hover:opacity-100 hover:border-indigo-500 z-10 focus-visible:ring-indigo-500'
                        : 'border border-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-600 z-10 focus-visible:ring-indigo-500',
                  ].join(''),
            ].join(' ')}
          >
            {/* Field label pill on active box */}
            {isActive && (
              <span
                className="absolute -top-6 left-0 text-[10px] font-semibold text-white bg-indigo-600 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none"
                aria-hidden="true"
              >
                {field.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

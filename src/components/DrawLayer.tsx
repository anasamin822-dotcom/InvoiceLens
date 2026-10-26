import { useRef, useState, type PointerEvent } from 'react';
import type { BoundingBox, Field } from '../types';
import { pixelToNormalized } from '../lib/coords';

interface DrawLayerProps {
  fields: Field[];
  onAddCustomField: (field: {
    key: string;
    label: string;
    value: string;
    box: BoundingBox;
  }) => void;
  onUpdateFieldBox: (key: string, box: BoundingBox) => void;
  onCancel: () => void;
}

export function DrawLayer({
  fields,
  onAddCustomField,
  onUpdateFieldBox,
  onCancel,
}: DrawLayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Modal / popover state once a rect is drawn
  const [pendingBox, setPendingBox] = useState<BoundingBox | null>(null);
  const [actionType, setActionType] = useState<'existing' | 'new'>('new');
  const [selectedFieldKey, setSelectedFieldKey] = useState(fields[0]?.key || '');
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (pendingBox) return; // Wait until modal is resolved
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ left: x, top: y, width: 0, height: 0 });
    // Capture pointer for smooth drawing outside container
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const left = Math.min(startPoint.x, currentX);
    const top = Math.min(startPoint.y, currentY);
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);

    setCurrentRect({ left, top, width, height });
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentRect || !containerRef.current) return;
    setIsDrawing(false);

    const rect = containerRef.current.getBoundingClientRect();
    // Only accept boxes that are at least 15x15 pixels
    if (currentRect.width > 15 && currentRect.height > 15) {
      const normalized = pixelToNormalized(
        currentRect.left,
        currentRect.top,
        currentRect.width,
        currentRect.height,
        rect.width,
        rect.height,
      );
      setPendingBox(normalized);
    } else {
      setCurrentRect(null);
      setStartPoint(null);
    }
  };

  const handleSave = () => {
    if (!pendingBox) return;

    if (actionType === 'existing') {
      if (!selectedFieldKey) {
        setError('Please choose a field to attach.');
        return;
      }
      onUpdateFieldBox(selectedFieldKey, pendingBox);
      resetState();
    } else {
      if (!customLabel.trim()) {
        setError('Label is required.');
        return;
      }
      if (!customValue.trim()) {
        setError('Value is required.');
        return;
      }
      const customKey = `custom_${crypto.randomUUID()}`;
      onAddCustomField({
        key: customKey,
        label: customLabel.trim(),
        value: customValue.trim(),
        box: pendingBox,
      });
      resetState();
    }
  };

  const resetState = () => {
    setPendingBox(null);
    setCurrentRect(null);
    setStartPoint(null);
    setCustomLabel('');
    setCustomValue('');
    setError(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { setIsDrawing(false); setCurrentRect(null); }}
      className="absolute inset-0 z-30 cursor-crosshair select-none bg-indigo-950/10 touch-none"
      aria-label="Draw bounding box overlay"
    >
      {/* Instructions Banner */}
      {!pendingBox && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Click and drag a box across any text</span>
        </div>
      )}

      {/* Current Drawing Box */}
      {currentRect && (
        <div
          style={{
            left: `${currentRect.left}px`,
            top: `${currentRect.top}px`,
            width: `${currentRect.width}px`,
            height: `${currentRect.height}px`,
          }}
          className="absolute border-2 border-indigo-600 bg-indigo-500/30 rounded pointer-events-none"
        />
      )}

      {/* Box Assignment Dialog */}
      {pendingBox && (
        <div
          className="absolute inset-0 flex items-center justify-center p-4 bg-black/40 z-40 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Assign Bounding Box
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Attach this box to an existing field or create a new custom field.
            </p>

            <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActionType('new');
                  setError(null);
                }}
                className={[
                  'flex-1 py-1.5 rounded-md transition-colors',
                  actionType === 'new'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                New Field
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('existing');
                  setError(null);
                }}
                className={[
                  'flex-1 py-1.5 rounded-md transition-colors',
                  actionType === 'existing'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                Existing Field
              </button>
            </div>

            {actionType === 'new' ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    aria-label="Field label"
                    maxLength={100}
                    placeholder="e.g. Tax Amount, Vendor"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Extracted Value
                  </label>
                  <input
                    type="text"
                    aria-label="Extracted value"
                    maxLength={2000}
                    placeholder="e.g. 1,420.00"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Select Field to Re-align
                </label>
                <select
                  value={selectedFieldKey}
                  onChange={(e) => setSelectedFieldKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} ({f.value})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-600 font-medium mb-3">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  resetState();
                  onCancel();
                }}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Apply Box
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

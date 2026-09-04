import React, { useState, useEffect, useRef } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

interface RepsScrollPickerProps {
  isOpen: boolean;
  initialReps: number;
  onSelect: (reps: number) => void;
  onClose: () => void;
}

export const RepsScrollPicker: React.FC<RepsScrollPickerProps> = ({
  isOpen,
  initialReps,
  onSelect,
  onClose,
}) => {
  const [selectedReps, setSelectedReps] = useState<number>(initialReps);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Reps options array: 0 to 60 reps
  const repsOptions: number[] = [];
  for (let r = 0; r <= 60; r++) {
    repsOptions.push(r);
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedReps(initialReps);
      setTimeout(() => {
        const el = itemRefs.current.get(initialReps);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 80);
    }
  }, [isOpen, initialReps]);

  if (!isOpen) return null;

  const handleAdjust = (delta: number) => {
    setSelectedReps(prev => {
      const next = Math.max(0, Math.min(60, prev + delta));
      const el = itemRefs.current.get(next);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return next;
    });
  };

  const handleResetToZero = () => {
    setSelectedReps(0);
    const el = itemRefs.current.get(0);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-4 shadow-2xl space-y-3 text-center">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Выбор количества повторений
          </span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Reps Large Display */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1 relative">
          <div className="flex items-baseline justify-center gap-1.5 font-mono">
            <span className="text-3xl font-black text-white">{selectedReps}</span>
            <span className="text-sm font-bold text-zinc-400">повторений</span>
          </div>

          {/* Quick Clear / Eraser Button */}
          {selectedReps > 0 && (
            <button
              type="button"
              onClick={handleResetToZero}
              className="absolute right-2 top-2.5 px-2 py-1 bg-zinc-900 hover:bg-rose-950 text-rose-400 hover:text-rose-200 rounded-lg text-[10px] font-bold border border-zinc-800 transition-colors flex items-center gap-0.5"
              title="Стереть повторения (0)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Стереть</span>
            </button>
          )}
        </div>

        {/* Quick adjustment step buttons */}
        <div className="grid grid-cols-6 gap-1 text-[11px] font-mono font-bold">
          <button
            type="button"
            onClick={() => handleAdjust(-5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-2)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -2
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-1)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(1)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(2)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +2
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +5
          </button>
        </div>

        {/* Scrollable Wheel List with Natural Touch Inertia Physics */}
        <div
          ref={scrollRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
          className="h-44 overflow-y-auto bg-zinc-950 rounded-xl border border-zinc-800 p-1.5 space-y-1 snap-y snap-proximity scrollbar-thin shadow-inner overscroll-contain"
        >
          {repsOptions.map(r => {
            const isSelected = r === selectedReps;
            return (
              <button
                key={r}
                ref={el => {
                  if (el) itemRefs.current.set(r, el);
                  else itemRefs.current.delete(r);
                }}
                type="button"
                onClick={() => setSelectedReps(r)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all snap-center flex items-center justify-between ${
                  isSelected
                    ? 'bg-white text-zinc-950 font-black scale-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span>{r} повторений</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950" />}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(selectedReps);
              onClose();
            }}
            className="flex-1 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

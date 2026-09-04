import React, { useState, useEffect, useRef } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

interface WeightScrollPickerProps {
  isOpen: boolean;
  initialWeight: number;
  isMatrixBlock: boolean;
  onSelect: (weightKg: number) => void;
  onClose: () => void;
}

export const WeightScrollPicker: React.FC<WeightScrollPickerProps> = ({
  isOpen,
  initialWeight,
  isMatrixBlock,
  onSelect,
  onClose,
}) => {
  const [selectedWeight, setSelectedWeight] = useState<number>(initialWeight);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Weight options list: 0 to 120 in 0.5kg steps, 121 to 300 in 1kg steps
  const weights: number[] = [];
  for (let w = 0; w <= 120; w = Math.round((w + 0.5) * 10) / 10) {
    weights.push(w);
  }
  for (let w = 121; w <= 300; w++) {
    weights.push(w);
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedWeight(initialWeight);
      setTimeout(() => {
        const el = itemRefs.current.get(initialWeight);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 80);
    }
  }, [isOpen, initialWeight]);

  if (!isOpen) return null;

  const handleAdjust = (delta: number) => {
    setSelectedWeight(prev => {
      const next = Math.max(0, Math.min(300, Math.round((prev + delta) * 10) / 10));
      const el = itemRefs.current.get(next);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return next;
    });
  };

  const handleResetToZero = () => {
    setSelectedWeight(0);
    const el = itemRefs.current.get(0);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  const lbsValue = Math.round(selectedWeight * 2.20462);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-4 shadow-2xl space-y-3 text-center my-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Выбор рабочей массы
          </span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Weight Large Display */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1 relative">
          <div className="flex items-baseline justify-center gap-1 font-mono">
            <span className="text-3xl font-black text-white">{selectedWeight}</span>
            <span className="text-sm font-bold text-zinc-400">кг</span>
          </div>

          {/* lbs shown ONLY for block stack machines on Matrix */}
          {isMatrixBlock && selectedWeight > 0 ? (
            <div className="text-xs font-bold text-amber-400 font-mono">
              ~ {lbsValue} lbs <span className="text-[10px] text-zinc-500 font-sans">(Matrix Стек)</span>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-500 font-sans">
              Только кг (свободный вес / блины)
            </div>
          )}

          {/* Quick Clear / Eraser Button */}
          {selectedWeight > 0 && (
            <button
              type="button"
              onClick={handleResetToZero}
              className="absolute right-2 top-2.5 px-2 py-1 bg-zinc-900 hover:bg-rose-950 text-rose-400 hover:text-rose-200 rounded-lg text-[10px] font-bold border border-zinc-800 transition-colors flex items-center gap-0.5"
              title="Стереть указный вес (0 кг)"
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
            onClick={() => handleAdjust(-10)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-2.5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -2.5
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-0.5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            -0.5
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(0.5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +0.5
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(2.5)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +2.5
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(10)}
            className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 active:scale-95 transition-transform"
          >
            +10
          </button>
        </div>

        {/* Scrollable Wheel List */}
        <div
          ref={scrollRef}
          className="h-44 overflow-y-auto bg-zinc-950 rounded-xl border border-zinc-800 p-1.5 space-y-1 snap-y snap-mandatory scrollbar-thin shadow-inner"
        >
          {weights.map(w => {
            const isSelected = w === selectedWeight;
            return (
              <button
                key={w}
                ref={el => {
                  if (el) itemRefs.current.set(w, el);
                  else itemRefs.current.delete(w);
                }}
                type="button"
                onClick={() => setSelectedWeight(w)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all snap-center flex items-center justify-between ${
                  isSelected
                    ? 'bg-white text-zinc-950 font-black scale-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span>{w.toFixed(1)} кг</span>
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
              onSelect(selectedWeight);
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

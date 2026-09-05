import React, { useState, useEffect, useRef } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

interface WeightScrollPickerProps {
  isOpen: boolean;
  initialWeight: number;
  isMatrixBlock: boolean;
  baseTareWeight?: number;
  isAssisted?: boolean;
  isBodyweight?: boolean;
  bodyWeightKg?: number;
  onSelect: (weightKg: number) => void;
  onClose: () => void;
}

export const WeightScrollPicker: React.FC<WeightScrollPickerProps> = ({
  isOpen,
  initialWeight,
  isMatrixBlock,
  baseTareWeight = 0,
  isAssisted = false,
  isBodyweight = false,
  bodyWeightKg = 0,
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
  const assistedEffective = Math.max(0, Math.round((bodyWeightKg - selectedWeight) * 10) / 10);
  const bodyPlusExtra = Math.round((bodyWeightKg + selectedWeight) * 10) / 10;
  const totalEffectiveWeight = selectedWeight + baseTareWeight;

  const headerLabel = isAssisted
    ? 'Разгрузка гравитрона'
    : isBodyweight
      ? 'Доп. вес (0 = свой вес)'
      : baseTareWeight > 0
        ? 'Вес навешанных блинов'
        : 'Выбор рабочей массы';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-4 shadow-2xl space-y-3 text-center">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {headerLabel}
          </span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Weight Large Display */}
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1 relative">
          <div className="flex items-baseline justify-center gap-1 font-mono">
            <span className="text-3xl font-black text-white">{selectedWeight}</span>
            <span className="text-sm font-bold text-zinc-400">
              кг {isAssisted ? '(разгрузка)' : isBodyweight ? '(доп.)' : baseTareWeight > 0 ? '(блины)' : ''}
            </span>
          </div>

          {isAssisted && (
            <div className="text-xs font-bold text-amber-400 font-mono bg-amber-950/40 py-1 px-2 rounded-lg border border-amber-900/60 mt-1">
              {bodyWeightKg > 0
                ? `${bodyWeightKg} − ${selectedWeight} = ${assistedEffective} кг рабочих`
                : `−${selectedWeight} кг разгрузки (добавьте InBody, чтобы учесть вес тела)`}
            </div>
          )}

          {isBodyweight && !isAssisted && (
            <div className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/40 py-1 px-2 rounded-lg border border-emerald-900/60 mt-1">
              {bodyWeightKg > 0
                ? selectedWeight > 0
                  ? `${bodyWeightKg} + ${selectedWeight} = ${bodyPlusExtra} кг`
                  : `${bodyWeightKg} кг (свой вес)`
                : 'Свой вес (нет записи InBody)'}
            </div>
          )}

          {baseTareWeight > 0 && !isAssisted && (
            <div className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/40 py-1 px-2 rounded-lg border border-emerald-900/60 mt-1">
              + {baseTareWeight} кг ({baseTareWeight > 20 ? 'платформа' : 'гриф'}) = <span className="text-white font-black text-sm">{totalEffectiveWeight} кг всего</span>
            </div>
          )}

          {/* lbs shown ONLY for block stack machines on Matrix */}
          {isMatrixBlock && selectedWeight > 0 && (
            <div className="text-xs font-bold text-amber-400 font-mono">
              ~ {lbsValue} lbs <span className="text-[10px] text-zinc-500 font-sans">(Matrix Стек)</span>
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

        {/* Scrollable Wheel List with Natural Touch Inertia Physics */}
        <div
          ref={scrollRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
          className="h-44 overflow-y-auto bg-zinc-950 rounded-xl border border-zinc-800 p-1.5 space-y-1 snap-y snap-proximity scrollbar-thin shadow-inner overscroll-contain"
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
                onClick={() => {
                  setSelectedWeight(w);
                  onSelect(w);
                  onClose();
                }}
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

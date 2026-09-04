import React, { useState, useEffect } from 'react';
import { Play, Pause, X, CheckCircle2 } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  label?: string;
  onFinish?: () => void;
  autoStart?: boolean;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  label = 'Отдых',
  onFinish,
  autoStart = true,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            if (onFinish) onFinish();
            if ('vibrate' in navigator) {
              try {
                navigator.vibrate([200, 100, 200]);
              } catch {
                // ignore
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, onFinish]);

  const addTime = (addedSec: number) => {
    setSecondsLeft(prev => prev + addedSec);
    setIsActive(true);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFinished = secondsLeft === 0;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-50 max-w-md mx-auto animate-fadeIn">
      <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
        isFinished
          ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
          : 'bg-zinc-900/95 border-zinc-700 text-zinc-100'
      }`}>
        {/* Left: Label & Countdown */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            isFinished ? 'bg-emerald-400' : isActive ? 'bg-amber-400 animate-ping' : 'bg-zinc-500'
          }`} />
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[100px] sm:max-w-none">
              {label}:
            </span>
            <span className="font-mono text-sm font-black tracking-wider text-white">
              {formatTime(secondsLeft)}
            </span>
          </div>

          {isFinished && (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Пора!
            </span>
          )}
        </div>

        {/* Right: Quick Controls (+30s, Pause/Play, Dismiss X) */}
        <div className="flex items-center gap-1 shrink-0 text-xs">
          {!isFinished && (
            <>
              <button
                onClick={() => addTime(30)}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[10px] rounded-lg border border-zinc-700 transition-colors"
                title="+30 секунд"
              >
                +30s
              </button>

              <button
                onClick={() => setIsActive(!isActive)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors"
              >
                {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            onClick={onFinish}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 rounded-lg transition-colors ml-1"
            title="Закрыть"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

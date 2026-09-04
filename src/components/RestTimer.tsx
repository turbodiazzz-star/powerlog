import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, CheckCircle2 } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  label?: string;
  onFinish?: () => void;
  autoStart?: boolean;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  label = 'Отдых между подходами',
  onFinish,
  autoStart = false,
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

  const startTimer = (seconds?: number) => {
    if (seconds) setSecondsLeft(seconds);
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = (seconds: number = initialSeconds) => {
    setIsActive(false);
    setSecondsLeft(seconds);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((initialSeconds - secondsLeft) / initialSeconds) * 100));

  return (
    <div className="bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isActive ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => resetTimer(60)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 font-mono"
          >
            60с
          </button>
          <button
            onClick={() => resetTimer(90)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 font-mono"
          >
            90с
          </button>
          <button
            onClick={() => resetTimer(120)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 font-mono"
          >
            120с
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-wider">
            {formatTime(secondsLeft)}
          </span>
          {secondsLeft === 0 && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Готов к подходу!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Pause className="w-4 h-4" /> Пауза
            </button>
          ) : (
            <button
              onClick={() => startTimer()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Play className="w-4 h-4" /> Старт
            </button>
          )}

          <button
            onClick={() => resetTimer()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700 transition-colors"
            title="Сбросить"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import type {
  WorkoutSession,
  ExerciseSet,
  Gym,
} from '../types/workout';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { StorageService } from '../services/storage';
import { getOptionsForExercise, type MachineOption } from '../data/machineVariants';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface ActiveWorkoutProps {
  workoutType: 'A' | 'B';
  dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  gymId: string;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
}

const TIMER_PRESETS = [30, 60, 90, 120, 180];

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  workoutType,
  dayName,
  gymId,
  onFinishWorkout,
  onCancelWorkout,
}) => {
  const program = WORKOUT_PROGRAM[workoutType];
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [currentGymId, setCurrentGymId] = useState<string>(gymId);

  // Active Superset carousel index (0, 1, 2)
  const [activeSupersetIndex, setActiveSupersetIndex] = useState(0);

  // Touch swipe ref
  const touchStartX = useRef<number | null>(null);

  // Session timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerLabel, setTimerLabel] = useState<string>('');

  // Active session state
  const [session, setSession] = useState<WorkoutSession>(() => {
    const loadedGyms = StorageService.getGyms();
    const activeGym = loadedGyms.find(g => g.id === gymId) || loadedGyms[0];
    const gymBrand = activeGym?.brand || 'matrix';

    return {
      id: 'session_' + Date.now(),
      date: new Date().toISOString(),
      workoutType,
      dayName,
      gymId: activeGym?.id || gymId,
      gymName: activeGym?.name || '',
      completed: false,
      supersets: program.supersets.map(supersetDef => ({
        supersetId: supersetDef.id,
        supersetTitle: supersetDef.title,
        restIntervalSec1: supersetDef.rest1Sec,
        restIntervalSec2: supersetDef.rest2Sec,
        exercises: supersetDef.exercises.map(exDef => {
          const availableOptions = getOptionsForExercise(exDef.id, gymBrand);
          const prevVariant = StorageService.getPreviousVariantUsed(exDef.id);

          let selectedOption: MachineOption | undefined;
          if (prevVariant && availableOptions.length > 1) {
            selectedOption = availableOptions.find(opt => opt.name !== prevVariant);
          }
          if (!selectedOption) {
            selectedOption = availableOptions[0];
          }

          const variantName = selectedOption ? selectedOption.name : undefined;
          const history = StorageService.getLastExerciseLog(exDef.id, activeGym?.id, undefined, variantName);

          const defaultSetsCount = exDef.targetSets;
          const sets: ExerciseSet[] = [];

          for (let i = 1; i <= defaultSetsCount; i++) {
            const histSet = history?.sets[i - 1];
            sets.push({
              id: `set_${exDef.id}_${i}_${Date.now()}`,
              setNumber: i,
              weightKg: histSet?.weightKg || 0,
              reps: histSet?.reps || 10,
              completed: false,
            });
          }

          return {
            exerciseId: exDef.id,
            exerciseTitle: exDef.name,
            muscleGroup: exDef.muscleGroup,
            machineName: variantName,
            sets,
          };
        }),
      })),
    };
  });

  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadedGyms = StorageService.getGyms();
    setGyms(loadedGyms);

    const activeGym = loadedGyms.find(g => g.id === currentGymId);
    if (activeGym) {
      setSession(prev => ({
        ...prev,
        gymId: activeGym.id,
        gymName: activeGym.name,
      }));
    }
  }, [currentGymId]);

  // Workout duration counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest Timer countdown ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerRunning && timerSecondsLeft !== null && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            if ('vibrate' in navigator) {
              try {
                navigator.vibrate([200, 100, 200, 100, 300]);
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
  }, [isTimerRunning, timerSecondsLeft]);

  const startQuickTimer = (seconds: number, label?: string) => {
    setTimerInitialSeconds(seconds);
    setTimerSecondsLeft(seconds);
    setIsTimerRunning(true);
    if (label) setTimerLabel(label);
  };

  const handleGymChange = (newGymId: string) => {
    setCurrentGymId(newGymId);
    const gym = gyms.find(g => g.id === newGymId);
    const gymBrand = gym?.brand || 'matrix';

    setSession(prev => ({
      ...prev,
      gymId: newGymId,
      gymName: gym?.name || '',
      supersets: prev.supersets.map(ss => ({
        ...ss,
        exercises: ss.exercises.map(ex => {
          const availableOptions = getOptionsForExercise(ex.exerciseId, gymBrand);
          const prevVariant = StorageService.getPreviousVariantUsed(ex.exerciseId);

          let selectedOption = availableOptions.find(opt => opt.name === ex.machineName);
          if (!selectedOption) {
            if (prevVariant && availableOptions.length > 1) {
              selectedOption = availableOptions.find(opt => opt.name !== prevVariant);
            }
            if (!selectedOption) selectedOption = availableOptions[0];
          }

          return {
            ...ex,
            machineName: selectedOption ? selectedOption.name : ex.machineName,
          };
        }),
      })),
    }));
  };

  const handleVariantChange = (exerciseId: string, variantName: string) => {
    const history = StorageService.getLastExerciseLog(exerciseId, currentGymId, undefined, variantName);

    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => ({
        ...ss,
        exercises: ss.exercises.map(ex => {
          if (ex.exerciseId === exerciseId) {
            const updatedSets = ex.sets.map((st, idx) => {
              const histSet = history?.sets[idx];
              return {
                ...st,
                weightKg: histSet?.weightKg !== undefined ? histSet.weightKg : st.weightKg,
                reps: histSet?.reps !== undefined ? histSet.reps : st.reps,
              };
            });

            return {
              ...ex,
              machineName: variantName,
              sets: updatedSets,
            };
          }
          return ex;
        }),
      })),
    }));
  };

  const toggleSetCompleted = (
    supersetId: string,
    exerciseId: string,
    setId: string,
    restSec: number,
    muscleGroup: string
  ) => {
    let newlyCompleted = false;

    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => {
        if (ss.supersetId !== supersetId) return ss;
        return {
          ...ss,
          exercises: ss.exercises.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map(st => {
                if (st.id === setId) {
                  newlyCompleted = !st.completed;
                  return { ...st, completed: newlyCompleted };
                }
                return st;
              }),
            };
          }),
        };
      }),
    }));

    if (newlyCompleted) {
      startQuickTimer(restSec, muscleGroup);
    }
  };

  const updateSetField = (
    supersetId: string,
    exerciseId: string,
    setId: string,
    field: keyof ExerciseSet,
    value: number | string
  ) => {
    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => {
        if (ss.supersetId !== supersetId) return ss;
        return {
          ...ss,
          exercises: ss.exercises.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map(st => {
                if (st.id === setId) {
                  return { ...st, [field]: value };
                }
                return st;
              }),
            };
          }),
        };
      }),
    }));
  };

  const addSet = (supersetId: string, exerciseId: string) => {
    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => {
        if (ss.supersetId !== supersetId) return ss;
        return {
          ...ss,
          exercises: ss.exercises.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet: ExerciseSet = {
              id: `set_${exerciseId}_${ex.sets.length + 1}_${Date.now()}`,
              setNumber: ex.sets.length + 1,
              weightKg: lastSet ? lastSet.weightKg : 0,
              reps: lastSet ? lastSet.reps : 10,
              completed: false,
            };
            return { ...ex, sets: [...ex.sets, newSet] };
          }),
        };
      }),
    }));
  };

  const removeSet = (supersetId: string, exerciseId: string, setId: string) => {
    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => {
        if (ss.supersetId !== supersetId) return ss;
        return {
          ...ss,
          exercises: ss.exercises.map(ex => {
            if (ex.exerciseId !== exerciseId) return ex;
            const updatedSets = ex.sets
              .filter(st => st.id !== setId)
              .map((st, idx) => ({ ...st, setNumber: idx + 1 }));
            return { ...ex, sets: updatedSets };
          }),
        };
      }),
    }));
  };

  const toggleDetails = (key: string) => {
    setExpandedDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinishWorkout = () => {
    const totalSetsCompleted = session.supersets.reduce(
      (acc, ss) =>
        acc +
        ss.exercises.reduce((exAcc, ex) => exAcc + ex.sets.filter(s => s.completed).length, 0),
      0
    );

    if (
      totalSetsCompleted === 0 &&
      !confirm('Вы не выполнили ни одного подхода. Завершить и сохранить всё равно?')
    ) {
      return;
    }

    const completedSession: WorkoutSession = {
      ...session,
      durationMinutes: Math.round(elapsedSeconds / 60),
      completed: true,
      completedAt: new Date().toISOString(),
    };

    StorageService.saveSession(completedSession);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onFinishWorkout();
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimerDisplay = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const activeGym = gyms.find(g => g.id === currentGymId);
  const activeGymBrand = activeGym?.brand || 'matrix';

  // Swipe handlers for superset carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0 && activeSupersetIndex < program.supersets.length - 1) {
        setActiveSupersetIndex(prev => prev + 1);
      } else if (diffX < 0 && activeSupersetIndex > 0) {
        setActiveSupersetIndex(prev => prev - 1);
      }
    }
    touchStartX.current = null;
  };

  const currentSupersetDef = program.supersets[activeSupersetIndex];
  const loggedSuperset = session.supersets.find(s => s.supersetId === currentSupersetDef.id);

  return (
    <div className="space-y-3 pb-24 w-full max-w-md mx-auto overflow-x-hidden text-sm">
      {/* 1. Comfortable Header Strip (iOS Safe Area Padding, Tall Buttons) */}
      <header className="bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-40 pt-safe px-3.5 py-3 rounded-b-2xl shadow-lg space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Day & Gym Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-white text-zinc-950 font-black text-xs px-2.5 py-1 rounded-lg shrink-0 shadow-sm">
              ДЕНЬ {workoutType} ({dayName})
            </span>

            <select
              value={currentGymId}
              onChange={e => handleGymChange(e.target.value)}
              className="bg-zinc-950 text-xs text-zinc-200 font-bold rounded-lg px-2.5 py-1 border border-zinc-700 focus:outline-none shrink-0 max-w-[125px] truncate"
            >
              {gyms.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Clock & Finish/Cancel Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs font-mono font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onCancelWorkout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              title="Отменить тренировку"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={handleFinishWorkout}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black px-3.5 py-1.5 rounded-lg transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Готово</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Quick Rest Timer Header Bar (30, 60, 90, 120, 180s) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              ⏱️ Отдых {timerLabel ? `(${timerLabel})` : ''}:
            </span>
            {timerSecondsLeft !== null && (
              <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg border ${
                timerSecondsLeft === 0
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-bounce'
                  : 'bg-zinc-950 text-amber-400 border-zinc-800'
              }`}>
                {formatTimerDisplay(timerSecondsLeft)}
                {timerSecondsLeft === 0 && ' — ПОРА! 🎉'}
              </span>
            )}
          </div>

          {timerSecondsLeft !== null && timerSecondsLeft > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1.5 bg-zinc-800 text-zinc-200 hover:text-white rounded-lg border border-zinc-700 text-xs"
                title={isTimerRunning ? 'Пауза' : 'Старт'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setTimerSecondsLeft(timerInitialSeconds);
                  setIsTimerRunning(true);
                }}
                className="p-1.5 bg-zinc-800 text-zinc-200 hover:text-white rounded-lg border border-zinc-700 text-xs"
                title="Сброс"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setTimerSecondsLeft(null);
                  setIsTimerRunning(false);
                }}
                className="p-1.5 text-zinc-500 hover:text-white"
                title="Закрыть таймер"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Big Touch-Friendly Quick Buttons: 30s, 60s, 90s, 120s, 180s */}
        <div className="grid grid-cols-5 gap-1.5">
          {TIMER_PRESETS.map(sec => {
            const isCurrentPreset = timerInitialSeconds === sec && timerSecondsLeft !== null;
            return (
              <button
                key={sec}
                onClick={() => startQuickTimer(sec)}
                className={`py-2 px-1 text-center font-mono font-bold text-xs rounded-xl border transition-all active:scale-95 ${
                  isCurrentPreset && isTimerRunning
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md font-black'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Superset Tabs Carousel Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center justify-between gap-1 text-xs font-bold shadow-sm">
        {program.supersets.map((_, idx) => {
          const isActive = idx === activeSupersetIndex;
          return (
            <button
              key={idx}
              onClick={() => setActiveSupersetIndex(idx)}
              className={`flex-1 py-2 px-2 text-center rounded-lg transition-all uppercase text-xs ${
                isActive
                  ? 'bg-white text-zinc-950 font-black shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              Суперсет {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 4. Active Superset Cards (Fills Height, Large Touch Targets) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-3.5 shadow-md space-y-4 animate-fadeIn"
      >
        <div className="space-y-4">
          {currentSupersetDef.exercises.map((exDef) => {
            const loggedEx = loggedSuperset?.exercises.find(e => e.exerciseId === exDef.id);
            const availableVariants = getOptionsForExercise(exDef.id, activeGymBrand);
            const prevVariantName = StorageService.getPreviousVariantUsed(exDef.id);
            const selectedVariantName = loggedEx?.machineName || availableVariants[0]?.name || '';

            const variantHistoryLog = StorageService.getLastExerciseLog(
              exDef.id,
              currentGymId,
              undefined,
              selectedVariantName
            );

            const detailsKey = `details_${exDef.id}`;
            const isDetailsOpen = !!expandedDetails[detailsKey];

            return (
              <div
                key={exDef.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-3 shadow-sm"
              >
                {/* Exercise Header: Muscle Badge + Technique Button + Machine Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold px-2 py-0.5 rounded-lg shrink-0">
                        {exDef.muscleGroup}
                      </span>

                      {/* Technique Toggle Button */}
                      <button
                        onClick={() => toggleDetails(detailsKey)}
                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          isDetailsOpen
                            ? 'bg-amber-400 text-zinc-950 border-amber-300'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Техника</span>
                        {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <span className="text-xs text-zinc-500 font-mono">
                      {exDef.targetSets} × {exDef.targetReps}
                    </span>
                  </div>

                  {/* Machine Selector (Single Title & Selector combined) */}
                  <select
                    value={selectedVariantName}
                    onChange={e => handleVariantChange(exDef.id, e.target.value)}
                    className="w-full bg-zinc-900 text-xs text-white font-bold rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-zinc-500 truncate"
                  >
                    {availableVariants.map(opt => {
                      const isPrev = opt.name === prevVariantName;
                      return (
                        <option key={opt.id} value={opt.name}>
                          {opt.name} {isPrev ? ' (в прошлый раз)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Technique Description Accordion */}
                {isDetailsOpen && (
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 leading-relaxed animate-fadeIn">
                    <span className="font-bold text-amber-400 block mb-1">💡 Техника и фокус:</span>
                    {exDef.focusNotes}
                  </div>
                )}

                {/* Sets Table: Comfortable Touch Rows with Inline Historical Weights */}
                <div className="overflow-x-hidden pt-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800 text-[11px] uppercase font-bold">
                        <th className="py-2 px-1 w-28">Сет / Прошлый</th>
                        <th className="py-2 px-1">Вес (кг)</th>
                        <th className="py-2 px-1">Повторы</th>
                        <th className="py-2 px-1 text-center w-12">Готово</th>
                        <th className="py-2 px-0.5 text-right w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {loggedEx?.sets.map((st, idx) => {
                        const histSet = variantHistoryLog?.sets[idx];
                        return (
                          <tr
                            key={st.id}
                            className={`transition-all ${
                              st.completed ? 'bg-emerald-950/30 text-emerald-200' : ''
                            }`}
                          >
                            {/* Set # + Historical Weight Inline */}
                            <td className="py-2.5 px-1 font-mono text-xs">
                              <span className="font-bold text-zinc-300">#{idx + 1}</span>
                              {histSet ? (
                                <span className="text-amber-400 ml-2 font-bold text-xs">
                                  {histSet.weightKg}кг
                                </span>
                              ) : (
                                <span className="text-zinc-600 ml-2 text-xs">—</span>
                              )}
                            </td>

                            {/* Weight Input */}
                            <td className="py-2.5 px-1">
                              <input
                                type="number"
                                step="0.5"
                                value={st.weightKg || ''}
                                onChange={e =>
                                  updateSetField(
                                    currentSupersetDef.id,
                                    exDef.id,
                                    st.id,
                                    'weightKg',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-14 h-9 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-sm rounded-lg text-center focus:outline-none focus:border-zinc-400"
                              />
                            </td>

                            {/* Reps Input */}
                            <td className="py-2.5 px-1">
                              <input
                                type="number"
                                value={st.reps || ''}
                                onChange={e =>
                                  updateSetField(
                                    currentSupersetDef.id,
                                    exDef.id,
                                    st.id,
                                    'reps',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-14 h-9 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-sm rounded-lg text-center focus:outline-none focus:border-zinc-400"
                              />
                            </td>

                            {/* Checkbox */}
                            <td className="py-2.5 px-1 text-center">
                              <button
                                onClick={() =>
                                  toggleSetCompleted(
                                    currentSupersetDef.id,
                                    exDef.id,
                                    st.id,
                                    currentSupersetDef.rest1Sec,
                                    exDef.muscleGroup
                                  )
                                }
                                className="p-1 rounded-lg transition-transform active:scale-90"
                              >
                                {st.completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-950" />
                                ) : (
                                  <Circle className="w-6 h-6 text-zinc-600 hover:text-zinc-300" />
                                )}
                              </button>
                            </td>

                            {/* Delete Set */}
                            <td className="py-2.5 px-0.5 text-right">
                              {(loggedEx?.sets.length || 0) > 1 && (
                                <button
                                  onClick={() => removeSet(currentSupersetDef.id, exDef.id, st.id)}
                                  className="p-1 text-zinc-600 hover:text-rose-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => addSet(currentSupersetDef.id, exDef.id)}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-indigo-400" /> Добавить подход
                </button>
              </div>
            );
          })}
        </div>

        {/* Carousel Prev / Next Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-bold">
          <button
            disabled={activeSupersetIndex === 0}
            onClick={() => setActiveSupersetIndex(prev => prev - 1)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
              activeSupersetIndex === 0
                ? 'opacity-20 border-transparent text-zinc-600'
                : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Пред.</span>
          </button>

          <span className="text-xs text-zinc-500 font-mono">
            {activeSupersetIndex + 1} / {program.supersets.length}
          </span>

          <button
            disabled={activeSupersetIndex === program.supersets.length - 1}
            onClick={() => setActiveSupersetIndex(prev => prev + 1)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
              activeSupersetIndex === program.supersets.length - 1
                ? 'opacity-20 border-transparent text-zinc-600'
                : 'bg-white border-white text-zinc-950 font-black hover:bg-zinc-200 shadow-sm'
            }`}
          >
            <span>След.</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

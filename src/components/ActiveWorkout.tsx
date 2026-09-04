import React, { useState, useEffect, useRef } from 'react';
import type {
  WorkoutSession,
  ExerciseSet,
  Gym,
} from '../types/workout';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { StorageService } from '../services/storage';
import { getOptionsForExercise, type MachineOption } from '../data/machineVariants';
import { RestTimer } from './RestTimer';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Building2,
  Clock,
  Save,
  X,
  Timer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ActiveWorkoutProps {
  workoutType: 'A' | 'B';
  dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  gymId: string;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
}

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

  // Swipe gesture ref
  const touchStartX = useRef<number | null>(null);

  // Session date & elapsed timer
  const [workoutDate] = useState<string>(new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest timer state
  const [timerConfig, setTimerConfig] = useState<{ seconds: number; label: string } | null>(null);

  // Active session
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

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const startRestTimer = (seconds: number, label: string) => {
    setTimerConfig({
      seconds,
      label,
    });
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
      startRestTimer(restSec, `Отдых (${muscleGroup})`);
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

  const formattedDate = new Date(workoutDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

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
    <div className="space-y-3 pb-24 w-full max-w-md mx-auto overflow-x-hidden">
      {/* Top Header Bar with Safe Area for iOS Dynamic Island / Notch */}
      <header className="bg-zinc-900/95 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-40 pt-safe px-3 pb-2.5 rounded-b-xl shadow-md space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Workout Title & Date */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="bg-white text-zinc-950 font-black text-[11px] px-2 py-0.5 rounded shrink-0">
                ДЕНЬ {workoutType}
              </span>
              <span className="text-[11px] font-bold text-zinc-300 font-mono truncate">
                {formattedDate} ({dayName})
              </span>
            </div>
          </div>

          {/* Timer & Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono font-bold text-white">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onCancelWorkout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-800 rounded-lg transition-all"
              title="Отменить"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFinishWorkout}
              className="flex items-center gap-1 bg-white hover:bg-zinc-200 text-zinc-950 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Завершить</span>
            </button>
          </div>
        </div>

        {/* Current Gym Selector */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-400 min-w-0">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
            <span className="font-semibold text-white truncate">{activeGym?.name}</span>
          </div>

          <select
            value={currentGymId}
            onChange={e => handleGymChange(e.target.value)}
            className="bg-zinc-950 text-[11px] text-zinc-200 font-semibold rounded-md px-2 py-0.5 border border-zinc-700 focus:outline-none shrink-0 max-w-[120px]"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Floating Rest Timer */}
      {timerConfig && (
        <div className="animate-fadeIn px-1">
          <RestTimer
            initialSeconds={timerConfig.seconds}
            label={timerConfig.label}
            autoStart={true}
            onFinish={() => setTimerConfig(null)}
          />
        </div>
      )}

      {/* Superset Tab Selector (Swipe or Tap) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center justify-between gap-1 text-[11px] font-bold">
        {program.supersets.map((ss, idx) => {
          const isActive = idx === activeSupersetIndex;
          return (
            <button
              key={ss.id}
              onClick={() => setActiveSupersetIndex(idx)}
              className={`flex-1 py-1.5 px-1 text-center rounded-lg transition-all truncate ${
                isActive
                  ? 'bg-white text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              СУПЕРСЕТ {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Superset Display (Swipeable container) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3 shadow-sm space-y-3 animate-fadeIn"
      >
        {/* Superset Header & Timer Trigger */}
        <div className="border-b border-zinc-800/80 pb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
              {currentSupersetDef.title}
            </h3>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Отдых 1: {currentSupersetDef.rest1Text} • Отдых 2: {currentSupersetDef.rest2Text}
            </div>
          </div>

          <button
            onClick={() => startRestTimer(currentSupersetDef.rest1Sec, currentSupersetDef.title)}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all shrink-0"
          >
            <Timer className="w-3 h-3 text-amber-400" />
            <span>Отдых ({currentSupersetDef.rest1Text})</span>
          </button>
        </div>

        {/* Exercises in Current Superset */}
        <div className="space-y-3">
          {currentSupersetDef.exercises.map((exDef, exIndex) => {
            const loggedEx = loggedSuperset?.exercises.find(e => e.exerciseId === exDef.id);
            const isFirstInSuperset = exIndex === 0;
            const restIntervalSec = isFirstInSuperset
              ? currentSupersetDef.rest1Sec
              : currentSupersetDef.rest2Sec;

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
                className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 space-y-2 text-xs"
              >
                {/* Exercise Name & Muscle Group Badge */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                      {exDef.muscleGroup}
                    </span>
                    <span className="font-bold text-white text-xs truncate">{exDef.name}</span>
                  </div>

                  <button
                    onClick={() =>
                      startRestTimer(restIntervalSec, `Отдых (${exDef.muscleGroup})`)
                    }
                    className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded transition-colors shrink-0"
                  >
                    <Timer className="w-3 h-3 text-zinc-400" />
                    <span>Отдых</span>
                  </button>
                </div>

                {/* Machine Variant Selector */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="font-semibold text-zinc-300">Вариант тренажера:</span>
                    {prevVariantName && (
                      <span className="text-[9px] text-amber-400 font-mono truncate max-w-[140px]">
                        В прошлый раз: {prevVariantName}
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedVariantName}
                    onChange={e => handleVariantChange(exDef.id, e.target.value)}
                    className="w-full bg-zinc-950 text-xs text-white font-medium rounded px-2 py-1 border border-zinc-700 focus:outline-none"
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

                {/* Technique toggle */}
                <div>
                  <button
                    onClick={() => toggleDetails(detailsKey)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200"
                  >
                    <Info className="w-3 h-3 text-zinc-400" />
                    <span>Техника</span>
                    {isDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isDetailsOpen && (
                    <div className="mt-1 bg-zinc-900 p-2 rounded border border-zinc-800 text-[11px] text-zinc-300 leading-snug">
                      {exDef.focusNotes}
                    </div>
                  )}
                </div>

                {/* Historical Log for selected machine */}
                <div className="bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1 text-zinc-300 font-semibold">
                    <History className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Последний вес:</span>
                  </div>

                  {variantHistoryLog ? (
                    <div className="font-mono text-white font-bold text-[11px] pl-4">
                      {variantHistoryLog.sets.map(s => `${s.weightKg}кг×${s.reps}`).join(' | ')}
                    </div>
                  ) : (
                    <div className="text-zinc-500 italic pl-4">
                      Нет сохраненных весов
                    </div>
                  )}
                </div>

                {/* Compact Sets Table */}
                <div className="overflow-x-hidden pt-0.5">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-400 border-b border-zinc-800 text-[9px] uppercase font-bold">
                        <th className="py-1 px-1 text-center w-8">Сет</th>
                        <th className="py-1 px-1">Вес (кг)</th>
                        <th className="py-1 px-1">Повторы</th>
                        <th className="py-1 px-1 text-center w-12">Готово</th>
                        <th className="py-1 px-0.5 text-right w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {loggedEx?.sets.map((st, idx) => (
                        <tr
                          key={st.id}
                          className={`transition-all ${
                            st.completed ? 'bg-emerald-950/20 text-emerald-200' : ''
                          }`}
                        >
                          <td className="py-1.5 px-1 text-center font-bold font-mono text-zinc-400 text-[11px]">
                            #{idx + 1}
                          </td>

                          <td className="py-1.5 px-1">
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
                              className="w-14 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-xs rounded px-1.5 py-1 text-center focus:outline-none focus:border-zinc-400"
                            />
                          </td>

                          <td className="py-1.5 px-1">
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
                              className="w-14 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-xs rounded px-1.5 py-1 text-center focus:outline-none focus:border-zinc-400"
                            />
                          </td>

                          <td className="py-1.5 px-1 text-center">
                            <button
                              onClick={() =>
                                toggleSetCompleted(
                                  currentSupersetDef.id,
                                  exDef.id,
                                  st.id,
                                  restIntervalSec,
                                  exDef.muscleGroup
                                )
                              }
                              className="p-0.5 rounded transition-transform active:scale-90"
                            >
                              {st.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                              ) : (
                                <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-300" />
                              )}
                            </button>
                          </td>

                          <td className="py-1.5 px-0.5 text-right">
                            {(loggedEx?.sets.length || 0) > 1 && (
                              <button
                                onClick={() => removeSet(currentSupersetDef.id, exDef.id, st.id)}
                                className="p-0.5 text-zinc-600 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => addSet(currentSupersetDef.id, exDef.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-semibold pt-0.5"
                >
                  <Plus className="w-3 h-3" /> Добавить подход
                </button>
              </div>
            );
          })}
        </div>

        {/* Superset Carousel Navigation Footer (Prev / Next Step) */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-semibold">
          <button
            disabled={activeSupersetIndex === 0}
            onClick={() => setActiveSupersetIndex(prev => prev - 1)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
              activeSupersetIndex === 0
                ? 'opacity-30 border-transparent text-zinc-600'
                : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Пред. суперсет</span>
          </button>

          <span className="text-[10px] text-zinc-400 font-mono">
            {activeSupersetIndex + 1} из {program.supersets.length}
          </span>

          <button
            disabled={activeSupersetIndex === program.supersets.length - 1}
            onClick={() => setActiveSupersetIndex(prev => prev + 1)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
              activeSupersetIndex === program.supersets.length - 1
                ? 'opacity-30 border-transparent text-zinc-600'
                : 'bg-white border-white text-zinc-950 font-bold hover:bg-zinc-200'
            }`}
          >
            <span>След. суперсет</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  Calendar,
  Timer,
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

          // Preselect alternate variant if previous exists, else first option
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
    month: 'long',
    year: 'numeric',
  });

  const activeGym = gyms.find(g => g.id === currentGymId);
  const activeGymBrand = activeGym?.brand || 'matrix';

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sticky top-2 z-30 shadow-md space-y-3">
        <div className="flex justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white text-zinc-950 font-black text-xs px-2.5 py-0.5 rounded-lg">
                ТРЕНИРОВКА {workoutType}
              </span>
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {formattedDate} ({dayName})
              </span>
            </div>
            <h2 className="text-sm font-bold text-white mt-1">{program.subTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-xs font-bold text-white">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>

            <button
              onClick={onCancelWorkout}
              className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-800 rounded-xl transition-all"
              title="Отменить"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleFinishWorkout}
              className="flex items-center gap-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0"
            >
              <Save className="w-4 h-4" />
              Завершить
            </button>
          </div>
        </div>

        {/* Current Gym Selector */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-400 font-medium">Спортзал:</span>
          <select
            value={currentGymId}
            onChange={e => handleGymChange(e.target.value)}
            className="bg-zinc-950 text-white font-semibold rounded-lg px-2.5 py-1 border border-zinc-700 focus:outline-none focus:border-zinc-500"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.brand.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Rest Timer */}
      {timerConfig && (
        <div className="animate-fadeIn">
          <RestTimer
            initialSeconds={timerConfig.seconds}
            label={timerConfig.label}
            autoStart={true}
            onFinish={() => setTimerConfig(null)}
          />
        </div>
      )}

      {/* Supersets Rendering */}
      <div className="space-y-5">
        {program.supersets.map(supersetDef => {
          const loggedSuperset = session.supersets.find(s => s.supersetId === supersetDef.id);

          return (
            <div
              key={supersetDef.id}
              className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 shadow-sm space-y-4"
            >
              <div className="border-b border-zinc-800/80 pb-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">{supersetDef.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                    <span>Отдых 1: {supersetDef.rest1Text}</span>
                    <span>•</span>
                    <span>Отдых 2: {supersetDef.rest2Text}</span>
                  </div>
                </div>

                <button
                  onClick={() => startRestTimer(supersetDef.rest1Sec, supersetDef.title)}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  Отдыхаю ({supersetDef.rest1Text})
                </button>
              </div>

              {/* Exercises in Superset */}
              <div className="space-y-5">
                {supersetDef.exercises.map((exDef, exIndex) => {
                  const loggedEx = loggedSuperset?.exercises.find(e => e.exerciseId === exDef.id);
                  const isFirstInSuperset = exIndex === 0;
                  const restIntervalSec = isFirstInSuperset
                    ? supersetDef.rest1Sec
                    : supersetDef.rest2Sec;

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
                      className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 space-y-3"
                    >
                      {/* Exercise Header: Muscle Group & Machine Options */}
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] font-bold px-2 py-0.5 rounded">
                                {exDef.muscleGroup}
                              </span>
                              <span className="font-bold text-white text-sm">{exDef.name}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                              План: {exDef.targetSets} подх. по {exDef.targetReps} повт.
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              startRestTimer(restIntervalSec, `Отдых (${exDef.muscleGroup})`)
                            }
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Timer className="w-3.5 h-3.5 text-zinc-400" />
                            Отдыхаю
                          </button>
                        </div>

                        {/* machine variants selector */}
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-zinc-300">Варианты тренажеров:</span>
                            {prevVariantName && (
                              <span className="text-[10px] text-amber-400/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                                В прошлый раз: {prevVariantName}
                              </span>
                            )}
                          </div>

                          <select
                            value={selectedVariantName}
                            onChange={e => handleVariantChange(exDef.id, e.target.value)}
                            className="w-full bg-zinc-950 text-xs text-white font-medium rounded-lg px-2.5 py-2 border border-zinc-700 focus:outline-none focus:border-zinc-500"
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
                      </div>

                      {/* Technique details */}
                      <div>
                        <button
                          onClick={() => toggleDetails(detailsKey)}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Техника выполнения</span>
                          {isDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isDetailsOpen && (
                          <div className="mt-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                            {exDef.focusNotes}
                          </div>
                        )}
                      </div>

                      {/* Display last weights logged for the currently selected machine variant */}
                      <div className="bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-800 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                          <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Последний вес ({selectedVariantName}):
                          </span>
                        </div>

                        {variantHistoryLog ? (
                          <div className="font-mono text-white font-bold text-xs pl-5 pt-0.5">
                            {variantHistoryLog.sets.map(s => `${s.weightKg}кг × ${s.reps}`).join('  |  ')}
                            <span className="text-[10px] text-zinc-500 font-normal ml-2">
                              ({new Date(variantHistoryLog.sessionDate).toLocaleDateString('ru-RU')})
                            </span>
                          </div>
                        ) : (
                          <div className="text-zinc-500 text-[10px] italic pl-5">
                            Нет записей весов для этого конкретного тренажера
                          </div>
                        )}
                      </div>

                      {/* Sets table */}
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-zinc-400 border-b border-zinc-800 uppercase text-[10px] font-semibold">
                              <th className="py-2 px-1 w-10 text-center">Сет</th>
                              <th className="py-2 px-2">Вес (кг)</th>
                              <th className="py-2 px-2">Повторы</th>
                              <th className="py-2 px-2 text-center w-16">Готово</th>
                              <th className="py-2 px-1 text-right w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {loggedEx?.sets.map((st, idx) => (
                              <tr
                                key={st.id}
                                className={`transition-all ${
                                  st.completed ? 'bg-emerald-950/20 text-emerald-200' : 'hover:bg-zinc-900/40'
                                }`}
                              >
                                <td className="py-2 px-1 text-center font-bold font-mono text-zinc-400">
                                  #{idx + 1}
                                </td>

                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={st.weightKg || ''}
                                      onChange={e =>
                                        updateSetField(
                                          supersetDef.id,
                                          exDef.id,
                                          st.id,
                                          'weightKg',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-16 bg-zinc-900 border border-zinc-700 focus:border-zinc-500 text-white font-mono font-bold text-xs rounded-lg px-2 py-1 text-center"
                                    />
                                    <span className="text-zinc-500 font-medium">кг</span>
                                  </div>
                                </td>

                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={st.reps || ''}
                                      onChange={e =>
                                        updateSetField(
                                          supersetDef.id,
                                          exDef.id,
                                          st.id,
                                          'reps',
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                      className="w-16 bg-zinc-900 border border-zinc-700 focus:border-zinc-500 text-white font-mono font-bold text-xs rounded-lg px-2 py-1 text-center"
                                    />
                                    <span className="text-zinc-500 font-medium">раз</span>
                                  </div>
                                </td>

                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() =>
                                      toggleSetCompleted(
                                        supersetDef.id,
                                        exDef.id,
                                        st.id,
                                        restIntervalSec,
                                        exDef.muscleGroup
                                      )
                                    }
                                    className="p-1 rounded-lg transition-all active:scale-90"
                                  >
                                    {st.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-300" />
                                    )}
                                  </button>
                                </td>

                                <td className="py-2 px-1 text-right">
                                  {(loggedEx?.sets.length || 0) > 1 && (
                                    <button
                                      onClick={() => removeSet(supersetDef.id, exDef.id, st.id)}
                                      className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                                      title="Удалить подход"
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
                        onClick={() => addSet(supersetDef.id, exDef.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-semibold pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Добавить подход
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import type {
  WorkoutSession,
  ExerciseSet,
  Gym,
} from '../types/workout';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { StorageService } from '../services/storage';
import { getOptionsForExercise, isBlockMachineOption, getMachineBaseTareWeight, isAssistedMachine, type MachineOption } from '../data/machineVariants';
import { WeightScrollPicker } from './WeightScrollPicker';
import { RepsScrollPicker } from './RepsScrollPicker';
import { calcWorkingLoad, localLoadRecommendation } from '../utils/loadMath';
import { formatDateDot } from '../utils/dates';
import { AiService } from '../services/aiService';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface ActiveWorkoutProps {
  workoutType: 'A' | 'B';
  dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  gymId: string;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
}

const TIMER_PRESETS = [30, 60, 90, 120, 180];

// Helper to build/sync session structure against current WORKOUT_PROGRAM definition
const syncSessionWithProgram = (
  rawSession: WorkoutSession | null,
  wType: 'A' | 'B',
  wDay: 'Пн' | 'Ср' | 'Пт' | 'Доп',
  gId: string
): WorkoutSession => {
  const p = WORKOUT_PROGRAM[wType];
  const loadedGyms = StorageService.getGyms();
  const activeGym = loadedGyms.find(g => g.id === gId) || loadedGyms[0];
  const gymBrand = activeGym?.brand || 'matrix';

  const existingExercisesMap = new Map<string, { machineName?: string; sets: ExerciseSet[] }>();
  if (rawSession && rawSession.supersets) {
    for (const ss of rawSession.supersets) {
      for (const ex of ss.exercises) {
        if (ex.sets && ex.sets.length > 0) {
          existingExercisesMap.set(ex.exerciseId, {
            machineName: ex.machineName,
            sets: ex.sets,
          });
        }
      }
    }
  }

  const supersets = p.supersets.map(supersetDef => ({
    supersetId: supersetDef.id,
    supersetTitle: supersetDef.title,
    restIntervalSec1: supersetDef.rest1Sec,
    restIntervalSec2: supersetDef.rest2Sec,
    exercises: supersetDef.exercises.map(exDef => {
      const existing = existingExercisesMap.get(exDef.id);
      if (existing) {
        return {
          exerciseId: exDef.id,
          exerciseTitle: exDef.name,
          muscleGroup: exDef.muscleGroup,
          machineName: existing.machineName,
          sets: existing.sets.map(st => ({
            ...st,
            weightConfirmed: st.weightConfirmed ?? st.completed,
            repsConfirmed: st.repsConfirmed ?? st.completed,
          })),
        };
      }

      const availableOptions = getOptionsForExercise(exDef.id, gymBrand);
      const defaultVariant = StorageService.getPenultimateVariantUsed(exDef.id);

      let selectedOption: MachineOption | undefined = availableOptions.find(opt => opt.name === defaultVariant);
      if (!selectedOption) {
        selectedOption = availableOptions[0];
      }

      const variantName = selectedOption ? selectedOption.name : undefined;
      const history = StorageService.getLastExerciseLog(exDef.id, activeGym?.id, undefined, variantName);
      const lastWeight = history?.sets[0]?.weightKg || 0;
      const lastReps = history?.sets[0]?.reps || 10;

      const defaultSetsCount = exDef.targetSets;
      const sets: ExerciseSet[] = [];

      for (let i = 1; i <= defaultSetsCount; i++) {
        sets.push({
          id: `set_${exDef.id}_${i}_${Date.now()}`,
          setNumber: i,
          weightKg: lastWeight,
          reps: lastReps,
          completed: false,
          weightConfirmed: false,
          repsConfirmed: false,
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
  }));

  return {
    id: rawSession?.id || 'session_' + Date.now(),
    date: rawSession?.date || new Date().toISOString(),
    workoutType: wType,
    dayName: wDay,
    gymId: activeGym?.id || gId,
    gymName: activeGym?.name || '',
    completed: false,
    supersets,
  };
};

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  workoutType,
  dayName,
  gymId,
  onFinishWorkout,
}) => {
  const program = WORKOUT_PROGRAM[workoutType];
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [currentGymId, setCurrentGymId] = useState<string>(gymId);

  // Active Superset carousel index (0, 1, 2)
  const [activeSupersetIndex, setActiveSupersetIndex] = useState(0);

  // Touch swipe ref
  const touchStartX = useRef<number | null>(null);

  // Session duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Confirmation Modal State (Only Finish Modal now)
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Weight Scroll Picker Modal State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    supersetId: string;
    exerciseId: string;
    setId: string;
    currentWeight: number;
    isMatrixBlock: boolean;
    baseTareWeight?: number;
    isAssisted?: boolean;
    isBodyweight?: boolean;
    restSec: number;
  } | null>(null);

  // Reps Scroll Picker Modal State
  const [repsPickerState, setRepsPickerState] = useState<{
    isOpen: boolean;
    supersetId: string;
    exerciseId: string;
    setId: string;
    currentReps: number;
    restSec: number;
  } | null>(null);

  // Rest Timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const workoutStartedAtRef = useRef<number>(Date.now());
  const restEndsAtRef = useRef<number | null>(null);
  const [aiRecs, setAiRecs] = useState<
    Record<string, { inputKg: number; sets: number; reps: string; note: string }>
  >({});
  const bodyWeightKg = StorageService.getLatestBodyWeightKg();

  // Active session state with draft restore fallback and program structure normalization
  const [session, setSession] = useState<WorkoutSession>(() => {
    const draft = StorageService.getActiveDraft(workoutType);
    return syncSessionWithProgram(draft ? draft.session : null, workoutType, dayName, gymId);
  });

  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Restore draft details on mount (wall-clock timers survive lock screen)
  useEffect(() => {
    const draft = StorageService.getActiveDraft(workoutType);
    if (draft) {
      const started =
        draft.workoutStartedAt || Date.now() - Math.max(0, draft.elapsedSeconds) * 1000;
      workoutStartedAtRef.current = started;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));

      if (draft.timerInitialSeconds) setTimerInitialSeconds(draft.timerInitialSeconds);
      if (draft.restEndsAt && draft.isTimerRunning) {
        restEndsAtRef.current = draft.restEndsAt;
        const left = Math.max(0, Math.ceil((draft.restEndsAt - Date.now()) / 1000));
        setTimerSecondsLeft(left);
        setIsTimerRunning(left > 0);
      }

      if (draft.activeSupersetIndex !== undefined) {
        setActiveSupersetIndex(draft.activeSupersetIndex);
      }
      if (draft.gymId) {
        setCurrentGymId(draft.gymId);
      }
    } else {
      workoutStartedAtRef.current = Date.now();
    }
  }, [workoutType]);

  useEffect(() => {
    const items = program.supersets.flatMap(ss =>
      ss.exercises.map(exDef => {
        const logged = session.supersets.flatMap(s => s.exercises).find(e => e.exerciseId === exDef.id);
        const history = StorageService.getLastExerciseLog(
          exDef.id,
          currentGymId,
          undefined,
          logged?.machineName
        );
        return {
          exerciseId: exDef.id,
          muscleGroup: exDef.muscleGroup,
          machineName: logged?.machineName || '',
          targetSets: exDef.targetSets,
          targetReps: exDef.targetReps,
          lastSets: (history?.sets || []).map(s => ({ weightKg: s.weightKg, reps: s.reps })),
        };
      })
    );

    void AiService.recommendSessionLoads({
      workoutType,
      bodyWeightKg,
      items,
    }).then(recs => {
      if (recs && Object.keys(recs).length) setAiRecs(recs);
    });
    // only once when workout screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Continuously save active draft AND sync logged sets directly to main history in localStorage
  useEffect(() => {
    StorageService.saveActiveDraft({
      workoutType,
      dayName,
      gymId: currentGymId,
      session,
      elapsedSeconds,
      lastUpdatedTimestamp: Date.now(),
      activeSupersetIndex,
      workoutStartedAt: workoutStartedAtRef.current,
      restEndsAt: restEndsAtRef.current,
      timerInitialSeconds,
      isTimerRunning,
    });

    // Check if session has any logged sets (completed or weight/reps entered)
    const hasAnySets = StorageService.hasLoggedSets(session);
    if (hasAnySets) {
      // Auto-sync session directly to main storage so data is NEVER lost even if app is closed
      StorageService.saveSession({
        ...session,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      });
    }
  }, [session, elapsedSeconds, activeSupersetIndex, currentGymId, workoutType, dayName, timerInitialSeconds, isTimerRunning]);

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

  const syncTimersFromClock = () => {
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutStartedAtRef.current) / 1000)));
    if (isTimerRunning && restEndsAtRef.current) {
      const left = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
      setTimerSecondsLeft(left);
      if (left <= 0) {
        setIsTimerRunning(false);
        restEndsAtRef.current = null;
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200, 100, 300]);
          } catch {
            // ignore
          }
        }
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(syncTimersFromClock, 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') syncTimersFromClock();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', syncTimersFromClock);
    window.addEventListener('pageshow', syncTimersFromClock);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', syncTimersFromClock);
      window.removeEventListener('pageshow', syncTimersFromClock);
    };
  }, [isTimerRunning]);

  const startQuickTimer = (seconds: number) => {
    setTimerInitialSeconds(seconds);
    restEndsAtRef.current = Date.now() + seconds * 1000;
    setTimerSecondsLeft(seconds);
    setIsTimerRunning(true);
  };

  const handleOpenPicker = (
    supersetId: string,
    exerciseId: string,
    setId: string,
    currentWeightKg: number,
    historyWeightKg?: number,
    isMatrixBlock?: boolean,
    baseTareWeight?: number,
    isAssisted?: boolean,
    isBodyweight?: boolean,
    restSec?: number
  ) => {
    const startWeight = currentWeightKg > 0 ? currentWeightKg : (historyWeightKg || 0);

    setPickerState({
      isOpen: true,
      supersetId,
      exerciseId,
      setId,
      currentWeight: startWeight,
      isMatrixBlock: !!isMatrixBlock,
      baseTareWeight: baseTareWeight || 0,
      isAssisted: !!isAssisted,
      isBodyweight: !!isBodyweight,
      restSec: restSec || 90,
    });
  };

  const handleOpenRepsPicker = (
    supersetId: string,
    exerciseId: string,
    setId: string,
    currentReps: number,
    targetRepsStr?: string,
    restSec?: number
  ) => {
    let startReps = currentReps;
    if (!startReps || startReps === 0) {
      if (targetRepsStr) {
        const match = targetRepsStr.match(/\d+/);
        if (match) {
          startReps = parseInt(match[0], 10);
        }
      }
      if (!startReps) startReps = 10;
    }

    setRepsPickerState({
      isOpen: true,
      supersetId,
      exerciseId,
      setId,
      currentReps: startReps,
      restSec: restSec || 90,
    });
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
          const defaultVariant = StorageService.getPenultimateVariantUsed(ex.exerciseId);

          let selectedOption = availableOptions.find(opt => opt.name === ex.machineName);
          if (!selectedOption) {
            selectedOption = availableOptions.find(opt => opt.name === defaultVariant) || availableOptions[0];
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
            const updatedSets = ex.sets.map(st => {
              const lastWeight = history?.sets[0]?.weightKg;
              const lastReps = history?.sets[0]?.reps;
              return {
                ...st,
                weightKg: lastWeight !== undefined ? lastWeight : st.weightKg,
                reps: lastReps !== undefined ? lastReps : st.reps,
                completed: false,
                weightConfirmed: false,
                repsConfirmed: false,
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

  const confirmSetValue = (
    exerciseId: string,
    setId: string,
    field: 'weightKg' | 'reps',
    value: number,
    restSec: number
  ) => {
    let justCompleted = false;

    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => ({
        ...ss,
        exercises: ss.exercises.map(ex => {
          if (ex.exerciseId !== exerciseId) return ex;

          const isFirstSet = ex.sets[0]?.id === setId || ex.sets.find(s => s.id === setId)?.setNumber === 1;
          const bodyKg = StorageService.getLatestBodyWeightKg();

          const updatedSets = ex.sets.map((st, idx) => {
            const isTarget = st.id === setId;
            const isLaterSet = idx > 0 && (ex.sets[0]?.id === setId || ex.sets.find(s => s.id === setId)?.setNumber === 1);
            const laterStillOpen = !(st.weightConfirmed && st.repsConfirmed) && !st.completed;

            let next = { ...st };

            if (isTarget) {
              if (field === 'weightKg') {
                const load = calcWorkingLoad(ex.machineName, value, bodyKg);
                next = {
                  ...next,
                  weightKg: value,
                  effectiveWeightKg: load.effectiveKg,
                  weightConfirmed: true,
                };
              } else {
                next = { ...next, reps: value, repsConfirmed: true };
              }
            } else if (isFirstSet && isLaterSet && laterStillOpen) {
              if (field === 'weightKg') {
                const load = calcWorkingLoad(ex.machineName, value, bodyKg);
                next = { ...next, weightKg: value, effectiveWeightKg: load.effectiveKg };
              }
              if (field === 'reps') {
                next = { ...next, reps: value };
              }
            }

            const wasCompleted = !!st.completed;
            const nowCompleted = !!(next.weightConfirmed && next.repsConfirmed);
            next.completed = nowCompleted;
            if (isTarget && nowCompleted && !wasCompleted) {
              justCompleted = true;
            }
            return next;
          });

          return { ...ex, sets: updatedSets };
        }),
      })),
    }));

    if (justCompleted) {
      startQuickTimer(restSec);
    }
  };

  const addSet = (_supersetId: string, exerciseId: string) => {
    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => ({
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
            weightConfirmed: false,
            repsConfirmed: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }),
      })),
    }));
  };

  const removeSet = (_supersetId: string, exerciseId: string, setId: string) => {
    setSession(prev => ({
      ...prev,
      supersets: prev.supersets.map(ss => ({
        ...ss,
        exercises: ss.exercises.map(ex => {
          if (ex.exerciseId !== exerciseId) return ex;
          const updatedSets = ex.sets
            .filter(st => st.id !== setId)
            .map((st, idx) => ({ ...st, setNumber: idx + 1 }));
          return { ...ex, sets: updatedSets };
        }),
      })),
    }));
  };

  const toggleDetails = (key: string) => {
    setExpandedDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const confirmAndFinishSession = () => {
    const completedSession: WorkoutSession = {
      ...session,
      durationMinutes: Math.round(elapsedSeconds / 60),
      completed: true,
      completedAt: new Date().toISOString(),
    };

    StorageService.saveSession(completedSession);
    StorageService.clearActiveDraft();

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

  return (
    <div className="space-y-2 pb-16 w-full max-w-md mx-auto overflow-x-hidden text-xs pt-safe">
      {/* 1. Header Card (NO X button, ONLY Finish button) */}
      <header className="bg-zinc-900/90 border border-zinc-700/70 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-1">
        {/* Left: Workout Type Badge + Gym Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="bg-white text-zinc-950 font-black text-xs px-2.5 py-1 rounded-md shrink-0 shadow-sm">
            {workoutType} · {formatDateDot(session.date)}
          </span>

          <select
            value={currentGymId}
            onChange={e => handleGymChange(e.target.value)}
            className="bg-zinc-950 text-xs text-zinc-200 font-bold rounded-md px-2 py-1 border border-zinc-700 focus:outline-none shrink-0 max-w-[110px] truncate"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Duration Clock + Finish Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800 text-xs font-mono font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="flex items-center gap-1 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black px-3 py-1 rounded-md transition-all active:scale-95 shrink-0 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Финиш</span>
          </button>
        </div>
      </header>

      {/* 2. Quick Rest Timer Row (With Reset Timer Button) */}
      <div className="bg-zinc-900/90 border border-zinc-700/70 rounded-2xl p-2 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-zinc-400 text-xs shrink-0">
              ⏱️ Отдых:
            </span>
            {timerSecondsLeft !== null && (
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                timerSecondsLeft === 0
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-bounce'
                  : 'bg-zinc-950 text-amber-400 border-zinc-800'
              }`}>
                {formatTimerDisplay(timerSecondsLeft)}
                {timerSecondsLeft === 0 && ' 🎉'}
              </span>
            )}
          </div>

          {/* Controls: Pause/Play, Reset, Close */}
          {timerSecondsLeft !== null && timerSecondsLeft > 0 && (
            <div className="flex items-center gap-1 shrink-0 text-xs">
              <button
                onClick={() => {
                  if (isTimerRunning) {
                    setIsTimerRunning(false);
                    restEndsAtRef.current = null;
                  } else if (timerSecondsLeft && timerSecondsLeft > 0) {
                    restEndsAtRef.current = Date.now() + timerSecondsLeft * 1000;
                    setIsTimerRunning(true);
                  }
                }}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700"
                title={isTimerRunning ? 'Пауза' : 'Старт'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  restEndsAtRef.current = Date.now() + timerInitialSeconds * 1000;
                  setTimerSecondsLeft(timerInitialSeconds);
                  setIsTimerRunning(true);
                }}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 flex items-center gap-0.5 font-bold"
                title="Сбросить таймер"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px]">Сброс</span>
              </button>

              <button
                onClick={() => {
                  restEndsAtRef.current = null;
                  setTimerSecondsLeft(null);
                  setIsTimerRunning(false);
                }}
                className="p-1 text-zinc-500 hover:text-white"
                title="Закрыть"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 5 Quick Preset Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {TIMER_PRESETS.map(sec => {
            const isCurrentPreset = timerInitialSeconds === sec && timerSecondsLeft !== null;
            return (
              <button
                key={sec}
                onClick={() => startQuickTimer(sec)}
                className={`py-1.5 px-1 text-center font-mono font-bold text-xs rounded-xl border transition-all active:scale-95 ${
                  isCurrentPreset && isTimerRunning
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black shadow-sm'
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
      <div className="bg-zinc-900/90 border border-zinc-700/70 rounded-2xl p-1 flex items-center justify-between gap-1 text-[11px] font-bold shadow-sm">
        {program.supersets.map((_, idx) => {
          const isActive = idx === activeSupersetIndex;
          return (
            <button
              key={idx}
              onClick={() => setActiveSupersetIndex(idx)}
              className={`flex-1 py-1.5 px-1.5 text-center rounded-xl transition-all uppercase ${
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

      {/* 4. Active Superset Container (Zero-Scroll Compact Layout) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-zinc-900/90 border border-zinc-700/80 rounded-3xl p-2 shadow-lg space-y-1.5 animate-fadeIn"
      >
        <div className="space-y-1.5">
          {currentSupersetDef.exercises.map((exDef) => {
            const loggedEx = session.supersets.flatMap(s => s.exercises).find(e => e.exerciseId === exDef.id);
            const availableVariants = getOptionsForExercise(exDef.id, activeGymBrand);
            const prevVariantName = StorageService.getPenultimateVariantUsed(exDef.id);
            const selectedVariantName = loggedEx?.machineName || availableVariants[0]?.name || '';

            const selectedOption = availableVariants.find(opt => opt.name === selectedVariantName) || availableVariants[0];
            const techniqueNotes = selectedOption?.focusNotes || exDef.focusNotes;

            const isBlockMachine = selectedOption?.isBlockMachine ?? isBlockMachineOption(selectedVariantName);
            const baseTareWeight = selectedOption?.baseTareWeight || getMachineBaseTareWeight(selectedVariantName);
            const assisted = isAssistedMachine(selectedVariantName);
            const bodyMove = !!selectedOption?.isBodyweight;

            const isMatrixBlock =
              (activeGymBrand === 'matrix' ||
                selectedOption?.brand === 'matrix' ||
                selectedVariantName.toLowerCase().includes('matrix')) &&
              isBlockMachine;

            const variantHistoryLog = StorageService.getLastExerciseLog(
              exDef.id,
              currentGymId,
              undefined,
              selectedVariantName
            );

            const detailsKey = `details_${exDef.id}`;
            const isDetailsOpen = !!expandedDetails[detailsKey];
            const aiRec = aiRecs[exDef.id];
            const localRec = localLoadRecommendation({
              lastSets: (variantHistoryLog?.sets || []).map(s => ({ weightKg: s.weightKg, reps: s.reps })),
              targetSets: exDef.targetSets,
              targetReps: exDef.targetReps,
              option: selectedOption,
            });
            const rec = aiRec || localRec;

            return (
              <div
                key={exDef.id}
                className="bg-zinc-950/80 border border-zinc-700/70 rounded-2xl p-2 space-y-1.5 shadow-inner"
              >
                {rec && rec.inputKg > 0 && (
                  <div className="px-2 py-1 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-300 leading-tight">
                    <span className="font-black text-emerald-400">{aiRec ? 'ИИ' : 'План'}:</span>{' '}
                    {assisted ? `разгрузка ${rec.inputKg} кг` : `${rec.inputKg} кг`} · {rec.sets} подх. × {rec.reps}
                    {rec.note ? ` · ${rec.note}` : ''}
                  </div>
                )}
                <div className="flex items-center justify-between gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-700/60">
                  {/* Left: Muscle badge */}
                  <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-bold px-1.5 py-0.5 rounded-lg shrink-0">
                    {exDef.muscleGroup}
                  </span>

                  {/* Center: Machine Selector */}
                  <select
                    value={selectedVariantName}
                    onChange={e => handleVariantChange(exDef.id, e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-950 text-xs text-white font-bold rounded-xl px-1.5 py-1 border border-zinc-700 focus:outline-none truncate"
                  >
                    {availableVariants.map(opt => {
                      const isPrev = opt.name === prevVariantName;
                      return (
                        <option key={opt.id} value={opt.name}>
                          {opt.name} {isPrev ? ' (предпоследний)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Right: Technique Toggle Button */}
                  <button
                    onClick={() => toggleDetails(detailsKey)}
                    className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-md border transition-all shrink-0 ${
                      isDetailsOpen
                        ? 'bg-amber-400 text-zinc-950 border-amber-300 font-black'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Техника</span>
                    {isDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Technique Description Accordion */}
                {isDetailsOpen && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[11px] text-zinc-300 leading-snug animate-fadeIn">
                    <span className="font-bold text-amber-400 block mb-0.5">💡 Техника для {selectedOption?.name}:</span>
                    {techniqueNotes}
                  </div>
                )}

                {/* Target Plan Badge */}
                <div className="flex items-center justify-between px-1 text-[10px] text-zinc-400 font-mono">
                  <span>
                    План: <strong className="text-zinc-200 font-sans">{exDef.targetSets} подх. по {exDef.targetReps} повт.</strong>
                    {assisted && bodyWeightKg > 0 && (
                      <span className="text-amber-400/90 ml-1">тело {bodyWeightKg} кг</span>
                    )}
                  </span>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_4.6rem_3.2rem_1.25rem] gap-1.5 px-1 text-[9px] uppercase font-bold text-zinc-500 tracking-wide">
                    <span>Сет / прошлый</span>
                    <span className="text-center">Вес</span>
                    <span className="text-center">Повт.</span>
                    <span />
                  </div>
                  {loggedEx?.sets.map((st, idx) => {
                        const histSet = variantHistoryLog?.sets[idx];
                        const histLoad = histSet
                          ? calcWorkingLoad(selectedVariantName, histSet.weightKg, bodyWeightKg)
                          : null;
                        const nowLoad = calcWorkingLoad(selectedVariantName, st.weightKg || 0, bodyWeightKg);

                        const weightConfirmed = !!st.weightConfirmed;
                        const repsConfirmed = !!st.repsConfirmed;
                        const setDone = !!st.completed || (weightConfirmed && repsConfirmed);

                        return (
                          <div
                            key={st.id}
                            className={`grid grid-cols-[minmax(0,1fr)_4.6rem_3.2rem_1.25rem] items-center gap-1 rounded-2xl px-1.5 py-1 border transition-all ${
                              setDone
                                ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm'
                                : 'bg-zinc-900/90 border-zinc-700/80'
                            }`}
                          >
                            <div className="min-w-0 font-mono text-[10px] leading-tight">
                              <span className={`font-black ${setDone ? 'text-zinc-950' : 'text-zinc-200'}`}>#{idx + 1}</span>
                              {histSet ? (
                                <span className={`ml-1 font-bold ${setDone ? 'text-zinc-800' : 'text-amber-400'}`}>
                                  {assisted
                                    ? histLoad?.formula
                                    : `${histLoad?.effectiveKg ?? histSet.weightKg}кг`}
                                </span>
                              ) : (
                                <span className={`ml-1 text-[9px] ${setDone ? 'text-zinc-700' : 'text-zinc-600'}`}>—</span>
                              )}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                  handleOpenPicker(
                                    currentSupersetDef.id,
                                    exDef.id,
                                    st.id,
                                    st.weightKg,
                                    histSet?.weightKg,
                                    isMatrixBlock,
                                    baseTareWeight,
                                    assisted,
                                    bodyMove,
                                    currentSupersetDef.rest1Sec
                                  )
                                }
                                className={`h-8 w-full rounded-2xl font-mono font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all ${
                                  weightConfirmed
                                    ? 'bg-zinc-950 text-emerald-300 border border-zinc-800'
                                    : 'bg-zinc-950 text-white border border-zinc-600'
                                }`}
                              >
                                <span>
                                  {assisted ? '−' : ''}
                                  {st.weightKg || 0}
                                </span>
                                <span className="text-[8px] text-emerald-400 font-bold leading-none truncate max-w-full px-0.5">
                                  {nowLoad.shortHint}
                                </span>
                              </button>

                            <button
                                type="button"
                                onClick={() =>
                                  handleOpenRepsPicker(
                                    currentSupersetDef.id,
                                    exDef.id,
                                    st.id,
                                    st.reps,
                                    exDef.targetReps,
                                    currentSupersetDef.rest1Sec
                                  )
                                }
                                className={`h-8 w-full rounded-2xl font-mono font-bold text-xs flex items-center justify-center active:scale-95 transition-all ${
                                  repsConfirmed
                                    ? 'bg-zinc-950 text-emerald-300 border border-zinc-800'
                                    : 'bg-zinc-950 text-white border border-zinc-600'
                                }`}
                              >
                                <span>{st.reps || 0}</span>
                              </button>

                            <div className="flex justify-center">
                              {(loggedEx?.sets.length || 0) > 1 && (
                                <button
                                  onClick={() => removeSet(currentSupersetDef.id, exDef.id, st.id)}
                                  className={`p-0.5 rounded-lg ${setDone ? 'text-zinc-700 hover:text-rose-700' : 'text-zinc-600 hover:text-rose-400'}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                </div>

                <button
                  onClick={() => addSet(currentSupersetDef.id, exDef.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white font-bold pt-0.5 px-1"
                >
                  <Plus className="w-3 h-3 text-indigo-400" /> Добавить подход
                </button>
              </div>
            );
          })}
        </div>

        {/* Carousel Prev / Next Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] font-bold">
          <button
            disabled={activeSupersetIndex === 0}
            onClick={() => setActiveSupersetIndex(prev => prev - 1)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-xl border transition-all ${
              activeSupersetIndex === 0
                ? 'opacity-20 border-transparent text-zinc-600'
                : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Пред.</span>
          </button>

          <span className="text-[9px] text-zinc-500 font-mono">
            {activeSupersetIndex + 1} / {program.supersets.length}
          </span>

          <button
            disabled={activeSupersetIndex === program.supersets.length - 1}
            onClick={() => setActiveSupersetIndex(prev => prev + 1)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-xl border transition-all ${
              activeSupersetIndex === program.supersets.length - 1
                ? 'opacity-20 border-transparent text-zinc-600'
                : 'bg-white border-white text-zinc-950 font-black hover:bg-zinc-200 shadow-sm'
            }`}
          >
            <span>След.</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Finish Workout */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3 text-center">
            <h3 className="text-sm font-bold text-white">Точно завершить тренировку?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Все выполненные подходы будут сохранены в вашу историю прогресса.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  confirmAndFinishSession();
                }}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black"
              >
                Да, Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Scroll Picker Modal */}
      {pickerState && (
        <WeightScrollPicker
          isOpen={pickerState.isOpen}
          initialWeight={pickerState.currentWeight}
          isMatrixBlock={pickerState.isMatrixBlock}
          baseTareWeight={pickerState.baseTareWeight}
          isAssisted={pickerState.isAssisted}
          isBodyweight={pickerState.isBodyweight}
          bodyWeightKg={bodyWeightKg}
          onSelect={w => {
            confirmSetValue(
              pickerState.exerciseId,
              pickerState.setId,
              'weightKg',
              w,
              pickerState.restSec
            );
          }}
          onClose={() => setPickerState(null)}
        />
      )}

      {/* Reps Scroll Picker Modal */}
      {repsPickerState && (
        <RepsScrollPicker
          isOpen={repsPickerState.isOpen}
          initialReps={repsPickerState.currentReps}
          onSelect={r => {
            confirmSetValue(
              repsPickerState.exerciseId,
              repsPickerState.setId,
              'reps',
              r,
              repsPickerState.restSec
            );
          }}
          onClose={() => setRepsPickerState(null)}
        />
      )}
    </div>
  );
};

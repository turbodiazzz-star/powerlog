import React, { useState, useEffect } from 'react';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { StorageService } from '../services/storage';
import { ActiveWorkout } from './ActiveWorkout';
import { ProgressView } from './ProgressView';
import type { Gym } from '../types/workout';
import {
  Dumbbell,
  Play,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const AppDashboard: React.FC = () => {
  const [activeNav, setActiveTab] = useState<'home' | 'progress'>('home');
  const [activeSessionProps, setActiveSessionProps] = useState<{
    workoutType: 'A' | 'B';
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  } | null>(null);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [recommendation, setRecommendation] = useState<{
    workoutType: 'A' | 'B';
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
    completedCount: number;
    lastDate?: string;
  }>({ workoutType: 'A', dayName: 'Пн', completedCount: 0 });

  useEffect(() => {
    refreshDashboardData();
  }, [activeNav, activeSessionProps]);

  const refreshDashboardData = () => {
    const loadedGyms = StorageService.getGyms();
    setGyms(loadedGyms);

    const defaultGymId = StorageService.getSelectedGymId() || loadedGyms[0]?.id || '';
    setSelectedGymId(defaultGymId);

    const rec = StorageService.getNextWorkoutRecommendation();
    setRecommendation(rec);
  };

  const handleStartWorkout = (type: 'A' | 'B', day: 'Пн' | 'Ср' | 'Пт' | 'Доп') => {
    setActiveSessionProps({
      workoutType: type,
      dayName: day,
    });
  };

  const handleGymSelect = (gymId: string) => {
    setSelectedGymId(gymId);
    StorageService.setSelectedGymId(gymId);
  };

  const currentGym = gyms.find(g => g.id === selectedGymId) || gyms[0];

  const currentDateFormatted = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });

  if (activeSessionProps) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ActiveWorkout
          workoutType={activeSessionProps.workoutType}
          dayName={activeSessionProps.dayName}
          gymId={selectedGymId}
          onFinishWorkout={() => {
            setActiveSessionProps(null);
            setActiveTab('progress');
          }}
          onCancelWorkout={() => setActiveSessionProps(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      {/* Header */}
      <header className="bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Dumbbell className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                POWER LOG <span className="text-[10px] text-zinc-400 font-mono">A/B</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">{currentDateFormatted}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* Home View */}
        {activeNav === 'home' && (
          <div className="space-y-5">
            {/* Active Gym Selector Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Выбранный спортзал</div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    {currentGym?.name}
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {currentGym?.brand}
                    </span>
                  </div>
                </div>
              </div>

              <select
                value={selectedGymId}
                onChange={e => handleGymSelect(e.target.value)}
                className="bg-zinc-950 text-xs text-white font-medium rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-full sm:w-auto"
              >
                {gyms.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.brand.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Next Recommended Workout Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full mb-1">
                    Следующая тренировка
                  </span>
                  <h2 className="text-xl font-black text-white">
                    ТРЕНИРОВКА {recommendation.workoutType}
                  </h2>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                    {WORKOUT_PROGRAM[recommendation.workoutType].subTitle}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-zinc-200 bg-zinc-800 px-2.5 py-1 rounded-xl">
                    {recommendation.dayName}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Всего сессий: {recommendation.completedCount}
                  </div>
                </div>
              </div>

              {/* Supersets grouped by Muscle Groups */}
              <div className="space-y-2 pt-1 border-t border-zinc-800/80 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Группы мышц в программе:
                </div>
                {WORKOUT_PROGRAM[recommendation.workoutType].supersets.map(ss => (
                  <div
                    key={ss.id}
                    className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div className="font-medium text-zinc-300">{ss.title}</div>
                    <div className="text-zinc-400 font-mono text-[10px] shrink-0">
                      {ss.exercises.map(e => e.muscleGroup).join(' + ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Workout Button */}
              <button
                onClick={() =>
                  handleStartWorkout(recommendation.workoutType, recommendation.dayName)
                }
                className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm py-3 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                Начать Тренировку {recommendation.workoutType}
              </button>
            </div>

            {/* Quick Workout Selection */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Запустить тренировку вручную
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleStartWorkout('A', 'Пн')}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-xl text-left transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white group-hover:text-zinc-200">
                      ТРЕНИРОВКА A
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{WORKOUT_PROGRAM.A.subTitle}</p>
                </button>

                <button
                  onClick={() => handleStartWorkout('B', 'Ср')}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-xl text-left transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white group-hover:text-zinc-200">
                      ТРЕНИРОВКА B
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{WORKOUT_PROGRAM.B.subTitle}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress View (Includes History, InBody & Photos) */}
        {activeNav === 'progress' && <ProgressView />}
      </main>

      {/* Bottom Navigation Bar (ONLY 2 BUTTONS: Главная & Прогресс) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-md z-40">
        <div className="max-w-2xl mx-auto grid grid-cols-2 h-14 px-4 gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-xl my-1.5 ${
              activeNav === 'home'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Главная</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-xl my-1.5 ${
              activeNav === 'progress'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Прогресс</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

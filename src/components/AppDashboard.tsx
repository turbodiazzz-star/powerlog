import React, { useState, useEffect } from 'react';
import { getWorkoutProgram } from '../data/workoutProgram';
import { StorageService } from '../services/storage';
import { CloudSync, type CloudStatus } from '../services/cloudSync';
import { formatDateDot } from '../utils/dates';
import { ActiveWorkout } from './ActiveWorkout';
import { ProgressView } from './ProgressView';
import { ProgramBuilder } from './ProgramBuilder';
import type { Gym, ActiveWorkoutDraft } from '../types/workout';
import {
  Dumbbell,
  Play,
  Building2,
  ChevronRight,
  TrendingUp,
  Clock,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AppDashboard: React.FC = () => {
  const APP_VERSION = '0029';
  const [activeNav, setActiveTab] = useState<'home' | 'progress' | 'program'>('home');
  const [activeSessionProps, setActiveSessionProps] = useState<{
    workoutType: string;
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  } | null>(null);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [recommendation, setRecommendation] = useState<{
    workoutType: string;
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
    completedCount: number;
    lastDate?: string;
  }>({ workoutType: 'A', dayName: 'Пн', completedCount: 0 });

  const [activeDraft, setActiveDraft] = useState<ActiveWorkoutDraft | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(() => CloudSync.isConnected() ? 'syncing' : 'disconnected');
  const [deviceAuth, setDeviceAuth] = useState<{ userCode: string; verificationUri: string; deviceCode: string; interval: number } | null>(null);
  const [cloudError, setCloudError] = useState('');

  useEffect(() => {
    const update = (event: Event) => setCloudStatus((event as CustomEvent<CloudStatus>).detail);
    window.addEventListener('powerlog:cloud-status', update);
    if (CloudSync.isConnected()) void CloudSync.hydrate();
    return () => window.removeEventListener('powerlog:cloud-status', update);
  }, []);

  useEffect(() => {
    if (!deviceAuth) return;
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const result = await CloudSync.finishDeviceAuthorization(deviceAuth.deviceCode);
        if (!stopped && result === 'connected') setDeviceAuth(null);
      } catch (error) {
        if (!stopped) { setCloudError(error instanceof Error ? error.message : 'Не удалось подключить GitHub'); setDeviceAuth(null); }
      }
    }, deviceAuth.interval * 1000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [deviceAuth]);

  const connectCloud = async () => {
    setCloudError('');
    try {
      const auth = await CloudSync.startDeviceAuthorization();
      setDeviceAuth(auth);
      window.open(auth.verificationUri, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : 'Не удалось открыть вход GitHub');
    }
  };

  // Auto-restore active draft session on initial mount if app was closed during workout
  useEffect(() => {
    const draft = StorageService.getActiveDraft();
    if (draft) {
      const timeDiffMs = Date.now() - draft.lastUpdatedTimestamp;
      // If draft was modified in the last 12 hours, auto-resume active workout screen
      if (timeDiffMs < 12 * 60 * 60 * 1000) {
        setActiveSessionProps({
          workoutType: draft.workoutType,
          dayName: draft.dayName,
        });
      }
    }
  }, []);

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

    const draft = StorageService.getActiveDraft();
    setActiveDraft(draft);
  };

  const handleStartWorkout = (type: string, day: 'Пн' | 'Ср' | 'Пт' | 'Доп') => {
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

  const currentDateFormatted = formatDateDot(new Date());
  const program = getWorkoutProgram();

  if (activeSessionProps) {
    return (
      <div className="w-full max-w-lg mx-auto px-3 py-2">
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 w-full max-w-md mx-auto overflow-x-hidden">
      {/* Header with Safe Area for iOS Dynamic Island / Notch */}
      <header className="bg-zinc-900/95 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-40 pt-safe px-4 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <Dumbbell className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-wider text-white leading-tight uppercase">
                ТРЕНИРОВКИ <span className="text-[9px] text-zinc-400 font-mono">A/B</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono leading-none">{currentDateFormatted}</p>
            </div>
            <span className="text-[8px] text-zinc-600 font-mono self-end mb-0.5">v{APP_VERSION}</span>
          </div>
          <button
            onClick={() => { if (!CloudSync.isConnected()) void connectCloud(); else void CloudSync.hydrate(); }}
            className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-bold flex items-center gap-1 ${cloudStatus === 'saved' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' : cloudStatus === 'disconnected' ? 'border-amber-500/50 text-amber-300 bg-amber-950/30' : 'border-zinc-600 text-zinc-300'}`}
            aria-label="Синхронизация с GitHub"
          >
            {cloudStatus === 'saved' ? <CheckCircle2 className="w-3 h-3" /> : cloudStatus === 'syncing' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
            {cloudStatus === 'saved' ? 'В облаке' : cloudStatus === 'syncing' ? 'Синхр.' : cloudStatus === 'retrying' ? 'Повтор' : 'Подключить'}
          </button>
        </div>
      </header>

      {(deviceAuth || cloudError) && (
        <div className="mx-3 mt-3 rounded-xl border border-emerald-500/40 bg-zinc-900 p-3 text-xs shadow-lg">
          {deviceAuth ? <>
            <p className="font-bold text-white">Подключаем личное облако GitHub</p>
            <p className="mt-1 text-zinc-400">В открывшейся вкладке введи код:</p>
            <p className="mt-2 rounded-lg bg-zinc-950 px-3 py-2 text-center font-mono text-lg tracking-[0.18em] text-emerald-400">{deviceAuth.userCode}</p>
            <p className="mt-2 text-zinc-500">После подтверждения данные с этого устройства сразу сольются с приватным облаком.</p>
          </> : <>
            <p className="font-semibold text-rose-300">{cloudError}</p>
            <button onClick={() => void connectCloud()} className="mt-2 text-emerald-400 font-bold">Повторить подключение</button>
          </>}
        </div>
      )}

      {/* Main Content */}
      <main className="px-3 pt-3 space-y-4">
        {activeNav === 'home' && (
          <div className="space-y-3.5">
            {/* Active Draft Banner if user has an ongoing session */}
            {activeDraft && (
              <div className="bg-amber-950/60 border border-amber-500/80 rounded-xl p-3 shadow-md flex items-center justify-between gap-2 text-xs animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-amber-200 block truncate">
                      Незавершённая тренировка {activeDraft.workoutType}
                    </span>
                    <span className="text-amber-400/80 text-[11px] block truncate">
                      Все веса и повторы сохранены в черновике
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartWorkout(activeDraft.workoutType, activeDraft.dayName)}
                  className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black px-3 py-1.5 rounded-lg text-xs shrink-0 shadow-sm flex items-center gap-1 active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Продолжить</span>
                </button>
              </div>
            )}

            {/* Active Gym Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Спортзал</div>
                  <div className="font-bold text-white text-xs truncate">
                    {currentGym?.name}
                  </div>
                </div>
              </div>

              <select
                value={selectedGymId}
                onChange={e => handleGymSelect(e.target.value)}
                className="bg-zinc-950 text-xs text-zinc-200 font-medium rounded-lg px-2 py-1 border border-zinc-700 focus:outline-none shrink-0 max-w-[140px]"
              >
                {gyms.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Workout Recommendation Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full mb-1">
                    Следующая тренировка
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">
                    ТРЕНИРОВКА {recommendation.workoutType}
                  </h2>
                  <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    {program[recommendation.workoutType]?.subTitle}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-lg inline-block">
                    {formatDateDot(new Date())}
                  </span>
                  <div className="text-[9px] text-zinc-500 mt-1 font-mono">
                    Сессий: {recommendation.completedCount}
                  </div>
                </div>
              </div>

              {/* Supersets preview list */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80 text-[11px]">
                {program[recommendation.workoutType]?.supersets.map(ss => (
                  <div
                    key={ss.id}
                    className="bg-zinc-950/80 border border-zinc-800/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-zinc-200 truncate pr-2">{ss.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                      {ss.exercises.map(e => e.muscleGroup).join(' + ')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Start Workout Button */}
              <button
                onClick={() =>
                  handleStartWorkout(recommendation.workoutType, recommendation.dayName)
                }
                className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 mt-1"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                Начать Тренировку {recommendation.workoutType}
              </button>
            </div>

            {/* Manual Workout Selection */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-sm space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Запустить тренировку вручную
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleStartWorkout('A', 'Пн')}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-lg text-left transition-all"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-white text-xs">ТРЕНИРОВКА A</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{program.A?.subTitle}</p>
                </button>

                <button
                  onClick={() => handleStartWorkout('B', 'Ср')}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-lg text-left transition-all"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-white text-xs">ТРЕНИРОВКА B</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{program.B?.subTitle}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'progress' && <ProgressView />}
        {activeNav === 'program' && <ProgramBuilder onSaved={refreshDashboardData} />}
      </main>

      {/* Sleek Minimalist Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800/90 backdrop-blur-md z-40 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-3 h-12 px-3 gap-2 py-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-lg ${
              activeNav === 'home'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Главная</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-lg ${
              activeNav === 'progress'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Прогресс</span>
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`flex items-center justify-center gap-1 text-xs font-bold transition-all rounded-lg ${activeNav === 'program' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>Настроить</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

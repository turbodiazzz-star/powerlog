import React, { useState, useEffect } from 'react';
import type { WorkoutSession, ExerciseDefinition } from '../types/workout';
import { StorageService } from '../services/storage';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import {
  History,
  TrendingUp,
  Building2,
  Trash2,
  Dumbbell,
  Clock,
  Filter,
} from 'lucide-react';

const ALL_EXERCISES: ExerciseDefinition[] = [
  ...WORKOUT_PROGRAM.A.supersets.flatMap(s => s.exercises),
  ...WORKOUT_PROGRAM.B.supersets.flatMap(s => s.exercises),
];

export const WorkoutHistoryAnalytics: React.FC = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(ALL_EXERCISES[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'sessions' | 'progression'>('sessions');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const loaded = StorageService.getSessions()
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSessions(loaded);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Удалить эту запись тренировки?')) {
      StorageService.deleteSession(sessionId);
      loadSessions();
    }
  };

  // Build progression data for selected exercise
  const exerciseProgression = sessions
    .map(session => {
      let maxWeight = 0;
      let totalReps = 0;
      let machineName = '';

      for (const superset of session.supersets) {
        for (const ex of superset.exercises) {
          if (ex.exerciseId === selectedExerciseId) {
            machineName = ex.machineName || '';
            const validSets = ex.sets.filter(s => s.completed);
            for (const s of validSets) {
              if (s.weightKg > maxWeight) maxWeight = s.weightKg;
              totalReps += s.reps;
            }
          }
        }
      }

      if (maxWeight === 0 && totalReps === 0) return null;

      return {
        date: session.date,
        gymName: session.gymName,
        machineName,
        maxWeight,
        totalReps,
        workoutType: session.workoutType,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" /> История
        </button>
        <button
          onClick={() => setActiveTab('progression')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'progression'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Динамика Весов
        </button>
      </div>

      {activeTab === 'sessions' ? (
        /* Sessions History List */
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 space-y-2">
              <History className="w-10 h-10 text-zinc-700 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-300">История тренировок пуста</h3>
              <p className="text-xs text-zinc-500">
                Завершите свою первую тренировку, чтобы просмотреть результаты по датам.
              </p>
            </div>
          ) : (
            sessions.map(session => {
              const formattedDate = new Date(session.date).toLocaleDateString('ru-RU', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded">
                          ДЕНЬ {session.workoutType}
                        </span>
                        <span className="text-xs font-bold text-zinc-200 font-mono">
                          {formattedDate} ({session.dayName})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        {session.gymName && (
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Building2 className="w-3 h-3 text-zinc-500" /> {session.gymName}
                          </span>
                        )}
                        {session.durationMinutes && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-zinc-500" /> {session.durationMinutes} мин
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Exercises Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {session.supersets.map(ss =>
                      ss.exercises.map(ex => {
                        const completedSets = ex.sets.filter(s => s.completed);
                        if (completedSets.length === 0) return null;

                        return (
                          <div
                            key={ex.exerciseId}
                            className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 space-y-1 text-xs"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-white text-[11px]">
                                [{ex.muscleGroup}] {ex.exerciseTitle}
                              </span>
                              {ex.machineName && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                                  {ex.machineName}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                              {completedSets.map((st, idx) => (
                                <span
                                  key={st.id}
                                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded"
                                >
                                  #{idx + 1}: <strong className="text-white">{st.weightKg}</strong>кг x {st.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Progression View */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Выберите группу мышц / упражнение
            </label>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={selectedExerciseId}
                onChange={e => setSelectedExerciseId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-zinc-500"
              >
                {ALL_EXERCISES.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    [{ex.muscleGroup}] {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progression timeline */}
          {exerciseProgression.length === 0 ? (
            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-6 text-center text-zinc-500">
              <Dumbbell className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
              <p className="text-xs">Записей по этому упражнению пока нет.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Динамика максимального веса по датам
              </h4>

              <div className="relative border-l border-zinc-800 ml-2 pl-3 space-y-3">
                {exerciseProgression.map((item, index) => {
                  const dateStr = new Date(item.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  const prevItem = exerciseProgression[index - 1];
                  const weightDiff = prevItem ? item.maxWeight - prevItem.maxWeight : 0;

                  return (
                    <div key={index} className="relative text-xs">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-900" />

                      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex justify-between items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-zinc-200">{dateStr}</span>
                            {item.gymName && (
                              <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded">
                                {item.gymName}
                              </span>
                            )}
                            {item.machineName && (
                              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                                {item.machineName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-bold text-white text-sm flex items-center gap-1 justify-end">
                            {item.maxWeight} кг
                            {weightDiff > 0 && (
                              <span className="text-xs text-emerald-400">(+{weightDiff}кг)</span>
                            )}
                            {weightDiff < 0 && (
                              <span className="text-xs text-rose-400">({weightDiff}кг)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500">Повторов: {item.totalReps}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

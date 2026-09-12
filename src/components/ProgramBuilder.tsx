import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { getWorkoutProgram } from '../data/workoutProgram';
import { MACHINE_OPTIONS } from '../data/machineVariants';
import { StorageService } from '../services/storage';
import type { ProgramWorkout, SupersetDefinition } from '../types/workout';

const MUSCLE_GROUPS = ['Грудь', 'Спина', 'Широчайшие', 'Трапеции', 'Плечи', 'Бицепс', 'Трицепс', 'Предплечья', 'Пресс', 'Квадрицепс', 'Бицепс бедра', 'Ягодицы', 'Икры', 'Приводящие', 'Отводящие', 'Кардио', 'Всё тело'];
const EQUIPMENT = ['Гантели', 'Штанга', 'Гири', 'Блины', 'Скамья', 'Турник', 'Брусья', 'Кроссовер', 'Резинки', 'Вес тела'];

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const ProgramBuilder: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const [program, setProgram] = useState<Record<string, ProgramWorkout>>(() => getWorkoutProgram());
  const [activeType, setActiveType] = useState(() => Object.keys(getWorkoutProgram())[0] || 'A');
  const [exerciseName, setExerciseName] = useState('');
  const [muscle, setMuscle] = useState(MUSCLE_GROUPS[0]);
  const [sets] = useState('4');
  const [reps] = useState('8–12');

  const active = program[activeType];
  const exerciseOptions = useMemo(() => {
    const names = MACHINE_OPTIONS.filter(item => item.muscleGroup === muscle || item.muscleGroup.includes(muscle) || muscle.includes(item.muscleGroup)).map(item => item.name);
    return Array.from(new Set(muscle === 'Кардио' ? names : [...names, ...EQUIPMENT])).sort();
  }, [muscle]);

  const save = (next: Record<string, ProgramWorkout>) => { setProgram(next); StorageService.saveCustomProgram(next); onSaved?.(); };
  const updateActive = (next: ProgramWorkout) => save({ ...program, [activeType]: next });

  const addWorkout = () => {
    const nextType = String.fromCharCode(65 + Object.keys(program).length);
    const workout: ProgramWorkout = { type: nextType, title: `ТРЕНИРОВКА ${nextType}`, subTitle: 'Новая тренировка', supersets: [] };
    save({ ...program, [nextType]: workout }); setActiveType(nextType);
  };
  const addSuperset = () => {
    const number = active.supersets.length + 1;
    const superset: SupersetDefinition = { id: makeId('ss'), number, title: `СУПЕРСЕТ ${number}`, rest1Text: '60 сек', rest1Sec: 60, rest2Text: '90 сек', rest2Sec: 90, exercises: [] };
    updateActive({ ...active, supersets: [...active.supersets, superset] });
  };
  const addExercise = (supersetId: string) => {
    if (!exerciseName.trim()) return;
    updateActive({ ...active, supersets: active.supersets.map(ss => ss.id !== supersetId ? ss : { ...ss, exercises: [...ss.exercises, { id: makeId('ex'), supersetId: ss.id, code: `${ss.number}.${ss.exercises.length + 1}`, name: exerciseName.trim(), muscleGroup: muscle, targetSets: Math.max(1, Number(sets) || 4), targetReps: reps || '8–12', focusNotes: `${exerciseName.trim()}.` }] }) });
    setExerciseName('');
  };
  const moveSuperset = (index: number, direction: -1 | 1) => { const next = [...active.supersets]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; updateActive({ ...active, supersets: next }); };
  const moveExercise = (supersetId: string, index: number, direction: -1 | 1) => { updateActive({ ...active, supersets: active.supersets.map(ss => { if (ss.id !== supersetId) return ss; const ex = [...ss.exercises]; const target = index + direction; if (target < 0 || target >= ex.length) return ss; [ex[index], ex[target]] = [ex[target], ex[index]]; return { ...ss, exercises: ex }; }) }); };

  return <div className="space-y-3">
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3"><div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-black text-white flex gap-2 items-center"><Settings2 className="w-4 h-4 text-emerald-400" />Конструктор тренировок</h2><p className="text-[10px] text-zinc-400">Программа, суперсеты и оборудование сохраняются в облаке.</p></div><button onClick={addWorkout} className="rounded-lg bg-emerald-400 px-2.5 py-2 text-xs font-black text-zinc-950"><Plus className="inline w-3.5 h-3.5" /> Тренировка</button></div><div className="mt-3 flex gap-1 overflow-x-auto">{Object.keys(program).map(type => <button key={type} onClick={() => setActiveType(type)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black ${type === activeType ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-zinc-400'}`}>{type}</button>)}</div></div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2"><input value={active.title} onChange={e => updateActive({ ...active, title: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm font-black text-white" /><input value={active.subTitle} onChange={e => updateActive({ ...active, subTitle: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-white" /><button onClick={addSuperset} className="w-full rounded-lg border border-dashed border-emerald-700 py-2 text-xs font-bold text-emerald-400">+ Добавить супerset</button></div>
    {active.supersets.map((ss, ssi) => <div key={ss.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2"><div className="flex gap-1"><input value={ss.title} onChange={e => updateActive({ ...active, supersets: active.supersets.map(item => item.id === ss.id ? { ...item, title: e.target.value } : item) })} className="min-w-0 flex-1 rounded-lg bg-zinc-950 px-2 py-2 text-xs font-black text-white" /><button onClick={() => moveSuperset(ssi,-1)} className="text-zinc-400">↑</button><button onClick={() => moveSuperset(ssi,1)} className="text-zinc-400">↓</button><button onClick={() => updateActive({ ...active, supersets: active.supersets.filter(item => item.id !== ss.id) })} className="text-rose-400"><Trash2 className="w-4 h-4" /></button></div>{ss.exercises.map((ex, ei) => <div key={ex.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-2 py-2 text-[11px]"><span>{ex.name} · <span className="text-zinc-500">{ex.muscleGroup}, {ex.targetSets}×{ex.targetReps}</span></span><span className="flex gap-1"><button onClick={() => moveExercise(ss.id,ei,-1)}>↑</button><button onClick={() => moveExercise(ss.id,ei,1)}>↓</button><button onClick={() => updateActive({ ...active, supersets: active.supersets.map(item => item.id === ss.id ? { ...item, exercises: item.exercises.filter(x => x.id !== ex.id) } : item) })} className="text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></span></div>)}<div className="grid grid-cols-2 gap-2"><select value={muscle} onChange={e => { setMuscle(e.target.value); setExerciseName(''); }} className="rounded-lg bg-zinc-950 px-2 py-2 text-xs text-white">{MUSCLE_GROUPS.map(x => <option key={x}>{x}</option>)}</select><select value={exerciseName} onChange={e => setExerciseName(e.target.value)} className="rounded-lg bg-zinc-950 px-2 py-2 text-xs text-white"><option value="">Упражнение / тренажёр</option>{exerciseOptions.map(x => <option key={x}>{x}</option>)}</select><div className="col-span-2 rounded-lg bg-zinc-950 px-2 py-2 text-xs text-zinc-400">4 подхода · 8–12 повторов</div></div><button onClick={() => addExercise(ss.id)} className="w-full rounded-lg bg-white py-2 text-xs font-black text-zinc-950">Добавить упражнение</button></div>)}
  </div>;
};

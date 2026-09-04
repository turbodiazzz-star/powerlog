import React, { useState, useEffect } from 'react';
import type { Gym, MachineEquipment } from '../types/workout';
import { StorageService } from '../services/storage';
import { WORKOUT_PROGRAM } from '../data/workoutProgram';
import { Building2, Plus, Edit2, Trash2, Dumbbell, AlertCircle, Settings2, Download, Upload } from 'lucide-react';

const ALL_EXERCISES = [
  ...WORKOUT_PROGRAM.A.supersets.flatMap(s => s.exercises),
  ...WORKOUT_PROGRAM.B.supersets.flatMap(s => s.exercises),
];

interface GymManagerProps {
  onSelectGym?: (gymId: string) => void;
  selectedGymId?: string;
}

export const GymManager: React.FC<GymManagerProps> = ({ onSelectGym, selectedGymId }) => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [machines, setMachines] = useState<MachineEquipment[]>([]);
  const [activeGymId, setActiveGymId] = useState<string>('');

  // Form states for Machine
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineEquipment | null>(null);
  const [machineExerciseId, setMachineExerciseId] = useState(ALL_EXERCISES[0]?.id || '');
  const [machineName, setMachineName] = useState('');
  const [emptyWeightKg, setEmptyWeightKg] = useState<number>(0);
  const [ratioMultiplier, setRatioMultiplier] = useState<number>(1.0);
  const [machineNotes, setMachineNotes] = useState('');

  // Export / Import state
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedGyms = StorageService.getGyms();
    const loadedMachines = StorageService.getMachines();
    setGyms(loadedGyms);
    setMachines(loadedMachines);

    const activeId = selectedGymId || StorageService.getSelectedGymId() || loadedGyms[0]?.id || '';
    setActiveGymId(activeId);
  };

  const handleSelectGym = (id: string) => {
    setActiveGymId(id);
    StorageService.setSelectedGymId(id);
    if (onSelectGym) onSelectGym(id);
  };

  // Machine Actions
  const openNewMachineModal = () => {
    if (!activeGymId) return;
    const currentGym = gyms.find(g => g.id === activeGymId);
    setEditingMachine(null);
    setMachineExerciseId(ALL_EXERCISES[0]?.id || '');
    setMachineName('');
    setEmptyWeightKg(currentGym?.brand === 'matrix' ? 11 : currentGym?.brand === 'technogym' ? 5 : 0);
    setRatioMultiplier(1.0);
    setMachineNotes('');
    setIsMachineModalOpen(true);
  };

  const openEditMachineModal = (machine: MachineEquipment) => {
    setEditingMachine(machine);
    setMachineExerciseId(machine.exerciseId);
    setMachineName(machine.machineName);
    setEmptyWeightKg(machine.emptyWeightKg);
    setRatioMultiplier(machine.ratioMultiplier || 1.0);
    setMachineNotes(machine.notes || '');
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGymId || !machineName.trim()) return;

    StorageService.saveMachine({
      id: editingMachine ? editingMachine.id : undefined,
      gymId: activeGymId,
      exerciseId: machineExerciseId,
      machineName,
      emptyWeightKg: Number(emptyWeightKg) || 0,
      ratioMultiplier: Number(ratioMultiplier) || 1.0,
      notes: machineNotes,
    });

    setIsMachineModalOpen(false);
    loadData();
  };

  const handleDeleteMachine = (machineId: string) => {
    if (confirm('Удалить настройку тренажера?')) {
      const updated = machines.filter(m => m.id !== machineId);
      StorageService.saveMachines(updated);
      loadData();
    }
  };

  // Export / Import
  const handleExportData = () => {
    const jsonStr = StorageService.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Данные экспортированы');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content && StorageService.importData(content)) {
        loadData();
        setExportNotice('Данные импортированы');
        setTimeout(() => setExportNotice(null), 3000);
      } else {
        alert('Ошибка при импорте файла!');
      }
    };
    reader.readAsText(file);
  };

  const currentGym = gyms.find(g => g.id === activeGymId);
  const currentGymMachines = machines.filter(m => m.gymId === activeGymId);

  return (
    <div className="space-y-6">
      {/* Gym Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" />
            Выбор Спортзала
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Переключайтесь между залами для точной привязки рабочих весов
          </p>
        </div>

        {/* List of Gym Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
          {gyms.map(gym => {
            const isActive = gym.id === activeGymId;
            return (
              <button
                key={gym.id}
                onClick={() => handleSelectGym(gym.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition-all border ${
                  isActive
                    ? 'bg-zinc-800 border-zinc-700 text-white font-bold'
                    : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{gym.name}</span>
                <span className="text-[10px] uppercase bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                  {gym.brand}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Gym Machines Section */}
      {currentGym && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentGym.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {currentGym.brand.toUpperCase()}
                </span>
              </div>
              {currentGym.notes && <p className="text-xs text-zinc-400 mt-0.5">{currentGym.notes}</p>}
            </div>

            <button
              onClick={openNewMachineModal}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            >
              <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
              Привязать тренажер
            </button>
          </div>

          {/* Machine List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Тренажеры в этом зале ({currentGymMachines.length})
            </h3>

            {currentGymMachines.length === 0 ? (
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-6 text-center text-zinc-400 space-y-2">
                <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-xs">В этом зале пока не добавлены специальные настройки тренажеров.</p>
                <button
                  onClick={openNewMachineModal}
                  className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Настроить тренажер
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentGymMachines.map(m => {
                  const exercise = ALL_EXERCISES.find(ex => ex.id === m.exerciseId);
                  return (
                    <div
                      key={m.id}
                      className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 flex justify-between items-start gap-3 hover:border-zinc-700 transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {exercise?.muscleGroup || '—'}
                          </span>
                          <span className="font-bold text-white">{m.machineName}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px]">{exercise?.name}</p>
                        <div className="flex flex-wrap gap-2 text-zinc-400 text-[10px] font-mono pt-1">
                          {m.emptyWeightKg > 0 && <span>Гриф: {m.emptyWeightKg} кг</span>}
                          {m.ratioMultiplier !== 1 && <span>Блок: x{m.ratioMultiplier}</span>}
                        </div>
                        {m.notes && <p className="text-zinc-500 italic text-[10px]">{m.notes}</p>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditMachineModal(m)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMachine(m.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-zinc-400" /> Резервное Копирование
          </h3>
          <p className="text-zinc-400 mt-0.5">
            Сохраните файл со всеми тренажерами и фото на устройство
          </p>
        </div>

        <div className="flex items-center gap-2">
          {exportNotice && <span className="text-emerald-400 font-semibold">{exportNotice}</span>}
          <button
            onClick={handleExportData}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700 font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Экспорт
          </button>
          <label className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700 font-bold cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Импорт
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Modal: Add Machine */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingMachine ? 'Редактировать тренажер' : 'Настройка тренажера'}
            </h3>

            <form onSubmit={handleSaveMachine} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Упражнение из программы</label>
                <select
                  value={machineExerciseId}
                  onChange={e => setMachineExerciseId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-500"
                >
                  {ALL_EXERCISES.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      [{ex.muscleGroup}] {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Название тренажера</label>
                <input
                  type="text"
                  required
                  placeholder="Смит №1 Matrix"
                  value={machineName}
                  onChange={e => setMachineName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Пустой гриф (кг)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={emptyWeightKg}
                    onChange={e => setEmptyWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Коэфф. блока</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ratioMultiplier}
                    onChange={e => setRatioMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Заметка</label>
                <input
                  type="text"
                  placeholder="Черный фиксатор"
                  value={machineNotes}
                  onChange={e => setMachineNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-zinc-950 font-bold rounded-xl"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

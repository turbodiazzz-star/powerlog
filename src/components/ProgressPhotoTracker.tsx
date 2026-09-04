import React, { useState, useEffect } from 'react';
import type { ProgressPhotoRecord, PhotoPose } from '../types/workout';
import { StorageService } from '../services/storage';
import {
  Camera,
  Plus,
  Upload,
  Trash2,
  Bell,
  X,
  Info,
} from 'lucide-react';

const POSE_LABELS: Record<PhotoPose, { title: string; hint: string }> = {
  front: {
    title: 'Анфас (Спереди)',
    hint: 'Стопы вместе, руки вдоль тела, пресс расслаблен (без втягивания). Свет спереди.',
  },
  side: {
    title: 'Профиль (Сбоку)',
    hint: 'Поворот на 90°, руки чуть отведены назад. Прямая осанка.',
  },
  back: {
    title: 'Спина (Сзади)',
    hint: 'Спина прямо, лопатки расправлены, руки расслаблены.',
  },
};

export const ProgressPhotoTracker: React.FC = () => {
  const [photos, setPhotos] = useState<ProgressPhotoRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PhotoPose>('front');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = () => {
    const loaded = StorageService.getProgressPhotos();
    setPhotos(loaded);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-detect photo creation date
    if (file.lastModified) {
      const photoDate = new Date(file.lastModified).toISOString().split('T')[0];
      setDate(photoDate);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    StorageService.saveProgressPhoto({
      date,
      pose: selectedPose,
      imageUrl,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      notes,
    });

    setIsModalOpen(false);
    resetForm();
    loadPhotos();
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setImageUrl('');
    setWeightKg('');
    setNotes('');
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm('Удалить эту фотографию?')) {
      StorageService.deleteProgressPhoto(id);
      loadPhotos();
    }
  };

  // Reminder calculation
  const lastPhoto = photos[0];
  let daysSinceLastPhoto = 0;
  if (lastPhoto) {
    const lastDate = new Date(lastPhoto.date).getTime();
    const now = new Date().getTime();
    daysSinceLastPhoto = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  }
  const showReminder = !lastPhoto || daysSinceLastPhoto >= 14;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            Прогресс-Фото Формы
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Фиксируйте форму в одинаковых ракурсах по датам для объективного отслеживания
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Добавить Фото
        </button>
      </div>

      {/* Photo Reminder Card if >14 days */}
      {showReminder && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Напоминание о прогресс-фото!</span>
              <span className="text-zinc-400">
                {lastPhoto
                  ? `С последнего фото прошло ${daysSinceLastPhoto} дн. Пора сделать новый снимок!`
                  : 'Загрузите первое фото вашей формы для отслеживания динамики.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl font-bold border border-zinc-700 shrink-0"
          >
            Сделать фото
          </button>
        </div>
      )}

      {/* Pose Guidance Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 text-xs space-y-3">
        <h3 className="font-bold text-zinc-300 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-400" /> Как правильно делать прогресс-фото:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(POSE_LABELS) as PhotoPose[]).map(pose => (
            <div key={pose} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/60">
              <span className="font-bold text-white block mb-1">{POSE_LABELS[pose].title}</span>
              <span className="text-zinc-400 text-[11px]">{POSE_LABELS[pose].hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Grid & Timeline */}
      {photos.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 space-y-3">
          <Camera className="w-10 h-10 text-zinc-700 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-zinc-300">Галерея фото пуста</h3>
            <p className="text-xs text-zinc-500 mt-1">Добавьте первое фото, чтобы сравнивать форму До и После.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Галерея прогресса по датам ({photos.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => {
              const dateStr = new Date(p.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800/90 rounded-2xl overflow-hidden group shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.pose}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300 border border-zinc-800">
                      {POSE_LABELS[p.pose].title.split(' ')[0]}
                    </div>

                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-2 right-2 p-1.5 bg-zinc-950/80 text-zinc-400 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-900 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-zinc-200">{dateStr}</span>
                      {p.weightKg && <span className="font-mono text-zinc-400">{p.weightKg} кг</span>}
                    </div>
                    {p.notes && <p className="text-[11px] text-zinc-400 truncate">{p.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Progress Photo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                Добавление Прогресс-Фото
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Выберите ракурс
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(POSE_LABELS) as PhotoPose[]).map(pose => (
                    <button
                      type="button"
                      key={pose}
                      onClick={() => setSelectedPose(pose)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedPose === pose
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {POSE_LABELS[pose].title.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/60">
                  💡 {POSE_LABELS[selectedPose].hint}
                </p>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Загрузить снимок</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer bg-zinc-950/60 transition-colors">
                  <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-xs font-medium text-zinc-300">
                    {imageUrl ? 'Изменить фото' : 'Нажмите, чтобы выбрать файл с галереи/камеры'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-zinc-800 max-h-40 aspect-[3/4] mx-auto">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Дата снимка</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Текущий вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="78.5"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Заметка</label>
                <input
                  type="text"
                  placeholder="Утреннее фото до еды"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition-all"
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

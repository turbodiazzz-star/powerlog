import React, { useState, useEffect } from 'react';
import type { ProgressPhotoRecord, PhotoPose } from '../types/workout';
import { StorageService } from '../services/storage';
import { AiService, type AiReport } from '../services/aiService';
import {
  Camera,
  Plus,
  Upload,
  Trash2,
  Bell,
  X,
  Info,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react';

const POSE_LABELS: Record<PhotoPose, { title: string; hint: string }> = {
  front: {
    title: 'Анфас (Спереди)',
    hint: 'Стопы вместе, руки вдоль тела, пресс расслаблен.',
  },
  side: {
    title: 'Профиль (Сбоку)',
    hint: 'Поворот на 90°, руки чуть отведены назад. Прямая осанка.',
  },
  back: {
    title: 'Спина (Сзади)',
    hint: 'Спина прямо, лопатки расправлены, руки расслаблены.',
  },
  biceps: {
    title: 'Бицепс',
    hint: 'Двойной бицепс (руки подняты и согнуты в локтях под 90°).',
  },
};

export const ProgressPhotoTracker: React.FC = () => {
  const [photos, setPhotos] = useState<ProgressPhotoRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PhotoPose>('front');
  const [autoReport, setAutoReport] = useState<AiReport | null>(null);
  const [autoReportStatus, setAutoReportStatus] = useState<'idle' | 'start' | 'done' | 'error'>('idle');
  const [autoReportError, setAutoReportError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [weightKg, setWeightKg] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    const onAuto = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        status: 'start' | 'done' | 'error';
        report?: AiReport;
        error?: string;
      };
      setAutoReportStatus(detail.status);
      if (detail.report) setAutoReport(detail.report);
      if (detail.error) setAutoReportError(detail.error);
    };
    window.addEventListener(AiService.AUTO_REPORT_EVENT, onAuto);
    return () => window.removeEventListener(AiService.AUTO_REPORT_EVENT, onAuto);
  }, []);

  const loadPhotos = () => {
    const loaded = StorageService.getProgressPhotos();
    setPhotos(loaded);
  };

  // Auto-match InBody date and weight
  const syncWithInBodyData = (targetDate: string) => {
    const inBodyRecords = StorageService.getInBodyRecords();
    const matchedRecord = inBodyRecords.find(r => r.date === targetDate);

    if (matchedRecord) {
      setWeightKg(matchedRecord.weightKg.toString());
    } else if (inBodyRecords.length > 0) {
      // Latest InBody weight fallback
      setWeightKg(inBodyRecords[0].weightKg.toString());
    }
  };

  const handleOpenModal = () => {
    const initialDate = new Date().toISOString().split('T')[0];
    setDate(initialDate);
    setImageUrl('');
    syncWithInBodyData(initialDate);
    setIsModalOpen(true);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    syncWithInBodyData(newDate);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let photoDate = date;
    if (file.lastModified) {
      photoDate = new Date(file.lastModified).toISOString().split('T')[0];
      setDate(photoDate);
    }
    syncWithInBodyData(photoDate);

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
    });

    setIsModalOpen(false);
    resetForm();
    loadPhotos();

    void AiService.generateAutoReport({
      trigger: 'photo',
      inBodyRecords: StorageService.getInBodyRecords(),
      photos: StorageService.getProgressPhotos(),
      recentSessions: StorageService.getSessions().filter(s => s.completed),
    }).catch(() => undefined);
  };

  const resetForm = () => {
    const nowStr = new Date().toISOString().split('T')[0];
    setDate(nowStr);
    setImageUrl('');
    setWeightKg('');
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
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            Прогресс-Фото Формы
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            4 ракурса по датам для наглядного сравнения
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Добавить Фото
        </button>
      </div>

      {autoReportStatus === 'start' && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-200">
          <Zap className="w-4 h-4 animate-bounce text-emerald-400 shrink-0" />
          <span className="font-bold">Gemini анализирует новое фото и состав тела...</span>
        </div>
      )}
      {autoReportStatus === 'error' && autoReportError && (
        <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{autoReportError}</span>
        </div>
      )}
      {autoReport && (autoReportStatus === 'done' || autoReportStatus === 'idle') && (
        <div className="bg-zinc-900 border border-emerald-900/60 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Автоотчёт ИИ</span>
            <span className="text-[10px] font-mono text-zinc-500">{autoReport.date}</span>
          </div>
          <p className="text-xs font-black text-white">{autoReport.verdictTitle}</p>
          <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
            {autoReport.fullMarkdown}
          </div>
        </div>
      )}

      {/* Photo Reminder Card if >14 days */}
      {showReminder && (
        <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Напоминание!</span>
              <span className="text-zinc-400 text-[11px]">
                {lastPhoto
                  ? `Прошло ${daysSinceLastPhoto} дн. Пора сделать новый снимок!`
                  : 'Загрузите первое фото вашей формы.'}
              </span>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg font-bold border border-zinc-700 shrink-0 text-xs"
          >
            Сделать фото
          </button>
        </div>
      )}

      {/* 4 Poses Guidance Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-2">
        <h3 className="font-bold text-zinc-300 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-400" /> 4 Основных Ракурса:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(POSE_LABELS) as PhotoPose[]).map(pose => (
            <div key={pose} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
              <span className="font-bold text-white block mb-0.5 text-[11px]">{POSE_LABELS[pose].title}</span>
              <span className="text-zinc-400 text-[10px] leading-tight block">{POSE_LABELS[pose].hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Grid & Timeline */}
      {photos.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 text-center text-zinc-500 space-y-2">
          <Camera className="w-8 h-8 text-zinc-700 mx-auto" />
          <div>
            <h3 className="text-xs font-bold text-zinc-300">Галерея фото пуста</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Добавьте первое фото для отслеживания динамики.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Галерея прогресса ({photos.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {photos.map(p => {
              const dateStr = new Date(p.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800/90 rounded-xl overflow-hidden group shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.pose}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-zinc-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-zinc-300 border border-zinc-800">
                      {POSE_LABELS[p.pose]?.title.split(' ')[0] || p.pose}
                    </div>

                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-zinc-950/80 text-zinc-400 hover:text-rose-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 bg-zinc-900 flex justify-between items-center text-[11px]">
                    <span className="font-mono font-bold text-zinc-200">{dateStr}</span>
                    {p.weightKg && <span className="font-mono text-zinc-400 font-bold">{p.weightKg} кг</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Progress Photo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3 max-h-[57vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                Добавление Прогресс-Фото
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Выберите ракурс (4 вида)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(POSE_LABELS) as PhotoPose[]).map(pose => (
                    <button
                      type="button"
                      key={pose}
                      onClick={() => setSelectedPose(pose)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                        selectedPose === pose
                          ? 'bg-white text-zinc-950 border-white font-black'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {POSE_LABELS[pose].title}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 bg-zinc-950 p-2 rounded-lg border border-zinc-800/60 leading-tight">
                  💡 {POSE_LABELS[selectedPose].hint}
                </p>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Загрузить снимок</label>
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg cursor-pointer bg-zinc-950/60 transition-colors">
                  <Upload className="w-4 h-4 text-indigo-400 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-300">
                    {imageUrl ? 'Изменить фото' : 'Выберите фото из галереи / камеры'}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-zinc-800 max-h-32 aspect-[3/4] mx-auto">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Дата снимка</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Текущий вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="78.5"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition-all"
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

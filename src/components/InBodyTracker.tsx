import React, { useState, useEffect } from 'react';
import type { InBodyRecord } from '../types/workout';
import { StorageService } from '../services/storage';
import { AiService, type AiReport } from '../services/aiService';
import { InBodyInfographic } from './InBodyInfographic';
import type { BodyGender, BodyProfile } from '../utils/inBodyNorms';
import {
  FileText,
  Plus,
  Upload,
  X,
  Zap,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const compressImageForOcr = (dataUrl: string, maxDim = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || dataUrl.startsWith('data:application/pdf')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const InBodyTracker: React.FC = () => {
  const [records, setRecords] = useState<InBodyRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordImage, setSelectedRecordImage] = useState<string | null>(null);
  const [profile, setProfile] = useState<BodyProfile>(() => StorageService.getBodyProfile());
  const [autoReport, setAutoReport] = useState<AiReport | null>(null);
  const [autoReportStatus, setAutoReportStatus] = useState<'idle' | 'start' | 'done' | 'error'>('idle');
  const [autoReportError, setAutoReportError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [fatMassKg, setFatMassKg] = useState<string>('');
  const [bodyFatPercent, setBodyFatPercent] = useState<string>('');
  const [fatFreeMassKg, setFatFreeMassKg] = useState<string>('');
  const [visceralFatLevel, setVisceralFatLevel] = useState<string>('');
  const [bmi, setBmi] = useState<string>('');
  const [inBodyScore, setInBodyScore] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // OCR Progress State (Gemini Only)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [ocrResultMsg, setOcrResultMsg] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

  useEffect(() => {
    loadRecords();
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

  // Auto-calculate derived fat mass if missing
  useEffect(() => {
    const w = parseFloat(weightKg);
    const ffm = parseFloat(fatFreeMassKg);
    const pbf = parseFloat(bodyFatPercent);

    if (w > 0 && ffm > 0 && ffm < w && !fatMassKg) {
      const calcFat = Math.round((w - ffm) * 10) / 10;
      setFatMassKg(calcFat.toString());
    } else if (w > 0 && pbf > 0 && pbf < 100 && !fatMassKg) {
      const calcFat = Math.round((w * (pbf / 100)) * 10) / 10;
      setFatMassKg(calcFat.toString());
    }
  }, [weightKg, fatFreeMassKg, bodyFatPercent, fatMassKg]);

  const loadRecords = () => {
    const loaded = StorageService.getInBodyRecords();
    // Sort chronologically ascending for charts
    const sorted = [...loaded].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRecords(sorted);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrResultMsg(null);
    setOcrProgress(0);

    let fileMetaDate = new Date().toISOString().split('T')[0];
    if (file.lastModified) {
      fileMetaDate = new Date(file.lastModified).toISOString().split('T')[0];
      setDate(fileMetaDate);
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rawDataUrl = evt.target?.result as string;

      setIsAnalyzing(true);
      setOcrStatusText('Сжатие файла...');
      setOcrProgress(20);

      const dataUrl = await compressImageForOcr(rawDataUrl);
      setImageUrl(dataUrl);

      setOcrStatusText('Распознавание файла через Gemini ИИ Vision...');
      setOcrProgress(50);

      try {
        const extracted = await AiService.scanInBodyWithGemini(dataUrl, fileMetaDate);
        setOcrProgress(100);
        setIsAnalyzing(false);

        const foundItems: string[] = [];
        if (extracted.date) {
          setDate(extracted.date);
          foundItems.push(`дата ${extracted.date}`);
        }
        if (extracted.weightKg) {
          setWeightKg(extracted.weightKg.toString());
          foundItems.push(`вес ${extracted.weightKg} кг`);
        }
        if (extracted.muscleMassKg) {
          setMuscleMassKg(extracted.muscleMassKg.toString());
          foundItems.push(`мышцы ${extracted.muscleMassKg} кг`);
        }
        if (extracted.bodyFatPercent) {
          setBodyFatPercent(extracted.bodyFatPercent.toString());
          foundItems.push(`жир ${extracted.bodyFatPercent}%`);
        }
        if (extracted.fatMassKg) {
          setFatMassKg(extracted.fatMassKg.toString());
          foundItems.push(`масса жира ${extracted.fatMassKg} кг`);
        }
        if (extracted.fatFreeMassKg) {
          setFatFreeMassKg(extracted.fatFreeMassKg.toString());
          foundItems.push(`безжировая масса ${extracted.fatFreeMassKg} кг`);
        }
        if (extracted.visceralFatLevel) {
          setVisceralFatLevel(extracted.visceralFatLevel.toString());
          foundItems.push(`висцеральный жир ${extracted.visceralFatLevel}`);
        }
        if (extracted.bmi) {
          setBmi(extracted.bmi.toString());
          foundItems.push(`ИМТ ${extracted.bmi}`);
        }
        if (extracted.inBodyScore) {
          setInBodyScore(extracted.inBodyScore.toString());
          foundItems.push(`оценка ${extracted.inBodyScore}`);
        }

        if (foundItems.length > 0) {
          setOcrResultMsg({
            type: 'success',
            msg: `Gemini ИИ распознал: ${foundItems.join(', ')}`,
          });
        } else {
          setOcrResultMsg({
            type: 'warn',
            msg: 'Gemini ИИ не нашел показателей на снимке. Пожалуйста, введите значения вручную.',
          });
        }
      } catch (err: any) {
        console.error('Gemini OCR failure', err);
        setIsAnalyzing(false);
        const userMsg = err?.message && err.message !== 'Type error' && err.message !== 'Failed to fetch'
          ? err.message
          : 'Не удалось распознать скан. Пожалуйста, введите показатели вручную.';
        setOcrResultMsg({
          type: 'warn',
          msg: userMsg,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;

    StorageService.saveInBodyRecord({
      date,
      weightKg: parseFloat(weightKg),
      muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
      fatMassKg: fatMassKg ? parseFloat(fatMassKg) : undefined,
      bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
      fatFreeMassKg: fatFreeMassKg ? parseFloat(fatFreeMassKg) : undefined,
      visceralFatLevel: visceralFatLevel ? parseFloat(visceralFatLevel) : undefined,
      bmi: bmi ? parseFloat(bmi) : undefined,
      inBodyScore: inBodyScore ? parseFloat(inBodyScore) : undefined,
      imageUrl: imageUrl || undefined,
      notes,
    });

    loadRecords();
    setIsModalOpen(false);

    setDate(new Date().toISOString().split('T')[0]);
    setWeightKg('');
    setMuscleMassKg('');
    setFatMassKg('');
    setBodyFatPercent('');
    setFatFreeMassKg('');
    setVisceralFatLevel('');
    setBmi('');
    setInBodyScore('');
    setImageUrl('');
    setNotes('');
    setOcrResultMsg(null);

    void AiService.generateAutoReport({
      trigger: 'inbody',
      inBodyRecords: StorageService.getInBodyRecords(),
      photos: StorageService.getProgressPhotos(),
      recentSessions: StorageService.getSessions().filter(s => s.completed),
    }).catch(() => undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить эту запись InBody?')) {
      StorageService.deleteInBodyRecord(id);
      loadRecords();
    }
  };

  const setGender = (gender: BodyGender) => {
    StorageService.setBodyGender(gender);
    setProfile(StorageService.getBodyProfile());
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-md gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white truncate">Состав тела · InBody</h2>
          <p className="text-[11px] text-zinc-400">Норма / недостаток / превышение · 4 параметра</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`px-2 py-1 rounded-md text-[10px] font-black ${
                profile.gender === 'male' ? 'bg-white text-zinc-950' : 'text-zinc-500'
              }`}
            >
              М
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`px-2 py-1 rounded-md text-[10px] font-black ${
                profile.gender === 'female' ? 'bg-white text-zinc-950' : 'text-zinc-500'
              }`}
            >
              Ж
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {autoReportStatus === 'start' && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-200">
          <Zap className="w-4 h-4 animate-bounce text-emerald-400 shrink-0" />
          <span className="font-bold">Gemini готовит отчёт по замеру и фото...</span>
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
          <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
            {autoReport.fullMarkdown}
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-xs space-y-2">
          <FileText className="w-8 h-8 text-zinc-700 mx-auto" />
          <p>Записи InBody пока отсутствуют.</p>
          <p className="text-[11px] text-zinc-600">После замера появится бланк как в отчёте InBody и динамика по 4 параметрам.</p>
        </div>
      ) : (
        <InBodyInfographic
          recordsAsc={records}
          profile={profile}
          onDelete={handleDelete}
          onOpenScan={url => setSelectedRecordImage(url)}
        />
      )}

      {/* Robust & Clean Mobile-first Modal: Add InBody Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

          <form
            onSubmit={handleSave}
            className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg sm:max-w-xl w-full shadow-2xl flex flex-col h-[57vh] max-h-[57vh] sm:h-[57vh] sm:max-h-[57vh] overflow-hidden text-xs my-auto"
          >
            {/* Fixed Header */}
            <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 min-w-0 truncate">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Загрузка & Ввод InBody</span>
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                  <span>Сохранить</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div
              style={{ WebkitOverflowScrolling: 'touch' }}
              className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 touch-pan-y"
            >
              {/* Scan Image / PDF Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <span>Фото / PDF скан распечатки InBody</span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Gemini ИИ Vision
                  </span>
                </div>

                <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-xl cursor-pointer bg-zinc-950/60 transition-all text-center active:scale-98">
                  <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {imageUrl ? 'Изменить файл (фото / PDF)' : 'Выбрать фото с телефона или PDF скан InBody'}
                  </span>
                  <span className="text-[10px] text-zinc-500">PNG, JPG, HEIC, PDF</span>
                  <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleImageUpload} className="hidden" />
                </label>

                {isAnalyzing && (
                  <div className="space-y-2 bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <Zap className="w-4 h-4 animate-bounce text-emerald-400" />
                      <span>{ocrStatusText || 'Gemini ИИ распознает данные...'}</span>
                    </div>
                    {ocrProgress > 0 && (
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {ocrResultMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                      ocrResultMsg.type === 'success'
                        ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/50 border-amber-800 text-amber-300'
                    }`}
                  >
                    {ocrResultMsg.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 stroke-[2.5] text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5] text-amber-400 mt-0.5" />
                    )}
                    <span className="leading-snug font-medium">{ocrResultMsg.msg}</span>
                  </div>
                )}

                {imageUrl && !isAnalyzing && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center p-2 max-h-32">
                    {imageUrl.startsWith('data:application/pdf') ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs py-2">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Загружен PDF документ InBody</span>
                      </div>
                    ) : (
                      <img src={imageUrl} alt="InBody scan" className="max-h-28 object-contain rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Показатели состава тела
                </div>

                {/* Row 1: Date | Total Weight */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 flex items-center justify-between truncate">
                      <span>Дата анализа</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 flex items-center justify-between truncate">
                      <span>Общий вес (кг)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Напр: 90.9"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 2: Muscle SMM | Fat-Free FFM */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Мышцы SMM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 38.6"
                      value={muscleMassKg}
                      onChange={e => setMuscleMassKg(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Безжировая FFM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 67.8"
                      value={fatFreeMassKg}
                      onChange={e => setFatFreeMassKg(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 3: Fat PBF (%) | Fat BFM (кг) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Жир PBF (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 25.4"
                      value={bodyFatPercent}
                      onChange={e => setBodyFatPercent(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Масса жира BFM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 23.1"
                      value={fatMassKg}
                      onChange={e => setFatMassKg(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 4: Visceral Fat Level | BMI */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Висцеральный жир
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Напр: 8"
                      value={visceralFatLevel}
                      onChange={e => setVisceralFatLevel(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      ИМТ (BMI)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 27.4"
                      value={bmi}
                      onChange={e => setBmi(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 5: InBody Score | Notes */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Оценка InBody
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Напр: 78"
                      value={inBodyScore}
                      onChange={e => setInBodyScore(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-300 truncate">
                      Заметка
                    </label>
                    <input
                      type="text"
                      placeholder="Напр: Утром"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="h-10.5 sm:h-11 w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end gap-3 px-4 sm:px-5 py-3.5 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold active:scale-95 transition-transform"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                Сохранить запись
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal View Full Image */}
      {selectedRecordImage && (
        <div
          onClick={() => setSelectedRecordImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setSelectedRecordImage(null)}
              className="absolute top-2 right-2 p-2 bg-zinc-900 text-white rounded-full border border-zinc-700 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedRecordImage.startsWith('data:application/pdf') ? (
              <iframe
                src={selectedRecordImage}
                title="InBody PDF"
                className="w-full h-[80vh] rounded-2xl border border-zinc-800 bg-white"
              />
            ) : (
              <img src={selectedRecordImage} alt="Full InBody" className="w-full rounded-2xl border border-zinc-800 object-contain max-h-[85vh]" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { InBodyRecord } from '../types/workout';
import { StorageService } from '../services/storage';
import { createWorker } from 'tesseract.js';
import {
  FileText,
  Plus,
  Upload,
  Calendar,
  Trash2,
  Image as ImageIcon,
  Activity,
  X,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ExtractedInBodyData {
  date?: string;
  weightKg?: number;
  muscleMassKg?: number;
  fatMassKg?: number;
  bodyFatPercent?: number;
  bmi?: number;
}

export function parseInBodyText(rawText: string): ExtractedInBodyData {
  // Replace comma decimal separators with dots for uniform float parsing
  const cleanText = rawText.replace(/(\d+),(\d+)/g, '$1.$2');

  let date: string | undefined;
  let weightKg: number | undefined;
  let muscleMassKg: number | undefined;
  let fatMassKg: number | undefined;
  let bodyFatPercent: number | undefined;
  let bmi: number | undefined;

  // 1. Find Date: YYYY.MM.DD or YYYY-MM-DD or DD.MM.YYYY
  const dateRegexYMD = /\b(20[123]\d)[.\/-](0[1-9]|1[0-2])[.\/-](0[1-9]|[12]\d|3[01])\b/;
  const dateRegexDMY = /\b(0[1-9]|[12]\d|3[01])[.\/-](0[1-9]|1[0-2])[.\/-](20[123]\d)\b/;

  const dateMatchYMD = cleanText.match(dateRegexYMD);
  if (dateMatchYMD) {
    date = `${dateMatchYMD[1]}-${dateMatchYMD[2].padStart(2, '0')}-${dateMatchYMD[3].padStart(2, '0')}`;
  } else {
    const dateMatchDMY = cleanText.match(dateRegexDMY);
    if (dateMatchDMY) {
      date = `${dateMatchDMY[3]}-${dateMatchDMY[2].padStart(2, '0')}-${dateMatchDMY[1].padStart(2, '0')}`;
    }
  }

  // 2. Keyword-based extraction
  const weightRegex = /(?:weight|вес|масса\s*тела)\D*?(\d{2,3}\.\d)/i;
  const smmRegex = /(?:smm|skeletal\s*muscle|скелетно[- ]мышечная|мышечная\s*масса)\D*?(\d{2,3}\.\d)/i;
  const bfmRegex = /(?:bfm|body\s*fat\s*mass|жировая\s*масса|масса\s*жира)\D*?(\d{1,3}\.\d)/i;
  const pbfRegex = /(?:pbf|percent\s*body\s*fat|процент\s*жира|пжk|pbf\s*%)\D*?(\d{1,2}\.\d)/i;
  const bmiRegex = /(?:bmi|имт|индекс\s*массы)\D*?(\d{1,2}\.\d)/i;

  const wMatch = cleanText.match(weightRegex);
  if (wMatch) weightKg = parseFloat(wMatch[1]);

  const smmMatch = cleanText.match(smmRegex);
  if (smmMatch) muscleMassKg = parseFloat(smmMatch[1]);

  const bfmMatch = cleanText.match(bfmRegex);
  if (bfmMatch) fatMassKg = parseFloat(bfmMatch[1]);

  const pbfMatch = cleanText.match(pbfRegex);
  if (pbfMatch) bodyFatPercent = parseFloat(pbfMatch[1]);

  const bmiMatch = cleanText.match(bmiRegex);
  if (bmiMatch) bmi = parseFloat(bmiMatch[1]);

  // 3. Heuristic fallback for numbers in typical ranges if keywords were unreadable
  const allFloats = (cleanText.match(/\b\d{1,3}\.\d\b/g) || []).map(n => parseFloat(n));

  if (!weightKg) {
    const possibleWeight = allFloats.find(n => n >= 40 && n <= 180);
    if (possibleWeight) weightKg = possibleWeight;
  }

  if (!muscleMassKg) {
    const possibleSMM = allFloats.find(n => n >= 18 && n <= 65 && n !== weightKg);
    if (possibleSMM) muscleMassKg = possibleSMM;
  }

  if (!bodyFatPercent) {
    const possiblePBF = allFloats.find(n => n >= 4 && n <= 50 && n !== weightKg && n !== muscleMassKg);
    if (possiblePBF) bodyFatPercent = possiblePBF;
  }

  if (!fatMassKg && weightKg && bodyFatPercent) {
    fatMassKg = Math.round((weightKg * (bodyFatPercent / 100)) * 10) / 10;
  }

  return { date, weightKg, muscleMassKg, fatMassKg, bodyFatPercent, bmi };
}

export const InBodyTracker: React.FC = () => {
  const [records, setRecords] = useState<InBodyRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordImage, setSelectedRecordImage] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [fatMassKg, setFatMassKg] = useState<string>('');
  const [bodyFatPercent, setBodyFatPercent] = useState<string>('');
  const [bmi, setBmi] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // OCR Progress State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [ocrResultMsg, setOcrResultMsg] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const loaded = StorageService.getInBodyRecords();
    setRecords(loaded);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset status
    setOcrResultMsg(null);
    setOcrProgress(0);

    // Default date fallback from file metadata if date on scan is not detected
    let fileMetaDate = new Date().toISOString().split('T')[0];
    if (file.lastModified) {
      fileMetaDate = new Date(file.lastModified).toISOString().split('T')[0];
      setDate(fileMetaDate);
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setImageUrl(dataUrl);

      setIsAnalyzing(true);
      setOcrStatusText('Инициализация распознавания снимка...');

      try {
        const worker = await createWorker('rus+eng');
        setOcrStatusText('Сканирование текста распечатки InBody...');
        setOcrProgress(40);

        const ret = await worker.recognize(dataUrl);
        await worker.terminate();

        const recognizedText = ret.data.text;
        setOcrProgress(100);
        setIsAnalyzing(false);

        // Parse metrics from real OCR recognized text
        const extracted = parseInBodyText(recognizedText);

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
        if (extracted.fatMassKg) {
          setFatMassKg(extracted.fatMassKg.toString());
          foundItems.push(`жир ${extracted.fatMassKg} кг`);
        }
        if (extracted.bodyFatPercent) {
          setBodyFatPercent(extracted.bodyFatPercent.toString());
          foundItems.push(`жир ${extracted.bodyFatPercent}%`);
        }
        if (extracted.bmi) {
          setBmi(extracted.bmi.toString());
          foundItems.push(`ИМТ ${extracted.bmi}`);
        }

        if (foundItems.length > 0) {
          setOcrResultMsg({
            type: 'success',
            msg: `Успешно распознано из снимка: ${foundItems.join(', ')}`,
          });
        } else {
          setOcrResultMsg({
            type: 'warn',
            msg: 'Не удалось точно разглядеть показатели на фото. Пожалуйста, введите или скорректируйте их вручную ниже.',
          });
        }
      } catch (err) {
        console.error('OCR analysis failed', err);
        setIsAnalyzing(false);
        setOcrResultMsg({
          type: 'warn',
          msg: 'Ошибка сканера или отсутствуют текстовые слои. Введите данные вручную ниже.',
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
      bmi: bmi ? parseFloat(bmi) : undefined,
      imageUrl: imageUrl || undefined,
      notes,
    });

    setIsModalOpen(false);
    resetForm();
    loadRecords();
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setWeightKg('');
    setMuscleMassKg('');
    setFatMassKg('');
    setBodyFatPercent('');
    setBmi('');
    setImageUrl('');
    setNotes('');
    setOcrResultMsg(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту запись InBody?')) {
      StorageService.deleteInBodyRecord(id);
      loadRecords();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Состав Тела & InBody
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Загружайте снимки распечаток InBody — сканируйте вес, скелетно-мышечную и жировую массу
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Добавить InBody
        </button>
      </div>

      {/* Main Records / Dynamic Tracker */}
      {records.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 space-y-3">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-zinc-300">Записей InBody пока нет</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Загрузите ваш первый скан или введите показатели анализа биоимпеданса.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs px-4 py-2 rounded-xl transition-all border border-zinc-700"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Загрузить первый снимок
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Historical Comparative Progression */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((rec, index) => {
              const prevRec = records[index + 1];
              const dateStr = new Date(rec.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              // Differences
              const muscleDiff =
                rec.muscleMassKg && prevRec?.muscleMassKg
                  ? rec.muscleMassKg - prevRec.muscleMassKg
                  : null;
              const fatDiff =
                rec.bodyFatPercent && prevRec?.bodyFatPercent
                  ? rec.bodyFatPercent - prevRec.bodyFatPercent
                  : null;

              return (
                <div
                  key={rec.id}
                  className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-5 shadow-sm space-y-4 relative group"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span className="font-mono text-xs font-bold text-zinc-200">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {rec.imageUrl && (
                        <button
                          onClick={() => setSelectedRecordImage(rec.imageUrl!)}
                          className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-zinc-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                          title="Посмотреть снимок"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Снимок
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">Общий вес</div>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        {rec.weightKg} <span className="text-xs text-zinc-400 font-normal">кг</span>
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">Мышцы (SMM)</div>
                      <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                        {rec.muscleMassKg ? `${rec.muscleMassKg} кг` : '—'}
                      </div>
                      {muscleDiff !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            muscleDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {muscleDiff >= 0 ? `+${muscleDiff.toFixed(1)}` : muscleDiff.toFixed(1)} кг
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">Жир (PBF)</div>
                      <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
                        {rec.bodyFatPercent ? `${rec.bodyFatPercent}%` : '—'}
                      </div>
                      {fatDiff !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            fatDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {fatDiff <= 0 ? `${fatDiff.toFixed(1)}%` : `+${fatDiff.toFixed(1)}%`}
                        </div>
                      )}
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                      <div className="text-[10px] uppercase font-bold text-zinc-500">ИМТ (BMI)</div>
                      <div className="text-base font-extrabold text-zinc-300 font-mono mt-0.5">
                        {rec.bmi || '—'}
                      </div>
                    </div>
                  </div>

                  {rec.notes && <p className="text-xs text-zinc-400 italic">{rec.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add InBody Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Загрузка & Ввод результатов InBody
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scan Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Загрузить фото / скан распечатки InBody
              </label>

              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer bg-zinc-950/60 transition-colors">
                <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="text-xs font-medium text-zinc-300">
                  {imageUrl ? 'Изменить изображение' : 'Выбрать фото с телефона или камеры'}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG, HEIC</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {isAnalyzing && (
                <div className="space-y-1.5 bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <Zap className="w-4 h-4 animate-bounce" />
                    <span>{ocrStatusText || 'Распознаем данные из снимка InBody...'}</span>
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
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
                    ocrResultMsg.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/50 border-amber-800 text-amber-300'
                  }`}
                >
                  {ocrResultMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  )}
                  <span>{ocrResultMsg.msg}</span>
                </div>
              )}

              {imageUrl && !isAnalyzing && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-36">
                  <img src={imageUrl} alt="InBody report" className="w-full object-cover" />
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Дата анализа</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Например: 78.5"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Мышцы SMM (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 36.2"
                    value={muscleMassKg}
                    onChange={e => setMuscleMassKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Жир PBF (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 18.8"
                    value={bodyFatPercent}
                    onChange={e => setBodyFatPercent(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Масса жира (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 14.8"
                    value={fatMassKg}
                    onChange={e => setFatMassKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Заметка</label>
                <input
                  type="text"
                  placeholder="Например: Натощак до тренировки"
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

      {/* Modal View Full Image */}
      {selectedRecordImage && (
        <div
          onClick={() => setSelectedRecordImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setSelectedRecordImage(null)}
              className="absolute top-2 right-2 p-2 bg-zinc-900 text-white rounded-full border border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedRecordImage} alt="Full InBody" className="w-full rounded-2xl border border-zinc-800 object-contain max-h-[85vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

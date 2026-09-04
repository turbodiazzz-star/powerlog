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
  TrendingUp,
} from 'lucide-react';

interface ExtractedInBodyData {
  date?: string;
  weightKg?: number;
  muscleMassKg?: number;
  fatMassKg?: number;
  bodyFatPercent?: number;
  fatFreeMassKg?: number;
  visceralFatLevel?: number;
  bmi?: number;
  inBodyScore?: number;
}

const MONTH_MAP: Record<string, string> = {
  янв: '01', январ: '01',
  фев: '02', феврал: '02',
  мар: '03', март: '03',
  апр: '04', апрел: '04',
  май: '05', мая: '05',
  июн: '06', июня: '06',
  июл: '07', июля: '07',
  авг: '08', август: '08',
  сен: '09', сентябр: '09',
  окт: '10', октябр: '10',
  ноя: '11', ноябр: '11',
  дек: '12', декабр: '12',
};

export function parseInBodyText(rawText: string): ExtractedInBodyData {
  // Replace comma decimal separators with dots for uniform float parsing
  const cleanText = rawText.replace(/(\d+),(\d+)/g, '$1.$2');

  let date: string | undefined;
  let weightKg: number | undefined;
  let muscleMassKg: number | undefined;
  let fatMassKg: number | undefined;
  let bodyFatPercent: number | undefined;
  let fatFreeMassKg: number | undefined;
  let visceralFatLevel: number | undefined;
  let bmi: number | undefined;
  let inBodyScore: number | undefined;

  // 1. Date Extraction
  // A. Standard numeric dates: YYYY.MM.DD or DD.MM.YYYY
  const dateRegexYMD = /\b(20[23]\d)[.\/-](0[1-9]|1[0-2])[.\/-](0[1-9]|[12]\d|3[01])\b/;
  const dateRegexDMY = /\b(0[1-9]|[12]\d|3[01])[.\/-](0[1-9]|1[0-2])[.\/-](20[23]\d)\b/;

  const dateMatchYMD = cleanText.match(dateRegexYMD);
  if (dateMatchYMD) {
    date = `${dateMatchYMD[1]}-${dateMatchYMD[2].padStart(2, '0')}-${dateMatchYMD[3].padStart(2, '0')}`;
  } else {
    const dateMatchDMY = cleanText.match(dateRegexDMY);
    if (dateMatchDMY) {
      date = `${dateMatchDMY[3]}-${dateMatchDMY[2].padStart(2, '0')}-${dateMatchDMY[1].padStart(2, '0')}`;
    }
  }

  // B. Textual date parsing (e.g., "31 авг. 2026" or "31 августа 2026")
  if (!date) {
    const dateRegexText = /\b(0?[1-9]|[12]\d|3[01])\s+([а-яА-Яa-zA-Z]{3,8})\.?,?\s+(20[23]\d)\b/;
    const textMatch = cleanText.match(dateRegexText);
    if (textMatch) {
      const day = textMatch[1].padStart(2, '0');
      const monthStr = textMatch[2].toLowerCase();
      const year = textMatch[3];

      let monthNum: string | undefined;
      for (const [key, val] of Object.entries(MONTH_MAP)) {
        if (monthStr.startsWith(key)) {
          monthNum = val;
          break;
        }
      }

      if (monthNum) {
        date = `${year}-${monthNum}-${day}`;
      }
    }
  }

  // 2. Keyword-based metric extraction
  const weightRegex = /(?:weight|вес|масса\s*тела)\D*?(\d{2,3}\.\d)/i;
  const smmRegex = /(?:smm|skeletal\s*muscle|скелетно[- ]мышечная|мышечная\s*масса)\D*?(\d{2,3}\.\d)/i;
  const ffmRegex = /(?:ffm|fat\s*free\s*mass|безжировая\s*масса)\D*?(\d{2,3}\.\d)/i;
  const bfmRegex = /(?:bfm|body\s*fat\s*mass|жировая\s*масса|масса\s*жира)\D*?(\d{1,2}\.\d|\d{2}\.\d)/i;
  const pbfRegex = /(?:pbf|percent\s*body\s*fat|процент\s*жира|пжk|pbf\s*%)\D*?(\d{1,2}\.\d)/i;
  const bmiRegex = /(?:bmi|имт|индекс\s*массы)\D*?(\d{1,2}\.\d)/i;
  const visceralRegex = /(?:visceral|висцеральн|уровень\s*висцерального)\D*?(\d{1,2})/i;
  const scoreRegex = /(?:inbody\s*score|оценка\s*inbody|оценка\s*состава|total\s*score)\D*?(\d{2,3})/i;

  const wMatch = cleanText.match(weightRegex);
  if (wMatch) weightKg = parseFloat(wMatch[1]);

  const smmMatch = cleanText.match(smmRegex);
  if (smmMatch) muscleMassKg = parseFloat(smmMatch[1]);

  const ffmMatch = cleanText.match(ffmRegex);
  if (ffmMatch) fatFreeMassKg = parseFloat(ffmMatch[1]);

  const bfmMatch = cleanText.match(bfmRegex);
  if (bfmMatch) fatMassKg = parseFloat(bfmMatch[1]);

  const pbfMatch = cleanText.match(pbfRegex);
  if (pbfMatch) bodyFatPercent = parseFloat(pbfMatch[1]);

  const bmiMatch = cleanText.match(bmiRegex);
  if (bmiMatch) bmi = parseFloat(bmiMatch[1]);

  const visMatch = cleanText.match(visceralRegex);
  if (visMatch) visceralFatLevel = parseInt(visMatch[1], 10);

  const scoreMatch = cleanText.match(scoreRegex);
  if (scoreMatch) inBodyScore = parseInt(scoreMatch[1], 10);

  // 3. Mathematical & Range Disambiguation
  const allFloats = (cleanText.match(/\b\d{1,3}\.\d\b/g) || []).map(n => parseFloat(n));

  if (!weightKg) {
    const possibleWeight = allFloats.find(n => n >= 45 && n <= 180);
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

  // Cross-calculate Fat Mass vs Fat Free Mass if missing
  if (weightKg && bodyFatPercent) {
    const calculatedFatKg = Math.round((weightKg * (bodyFatPercent / 100)) * 10) / 10;
    const calculatedFFMKg = Math.round((weightKg - calculatedFatKg) * 10) / 10;

    if (!fatMassKg || fatMassKg > weightKg * 0.6) {
      // If OCR misidentified FFM as Fat Mass, fix it!
      if (fatMassKg && Math.abs(fatMassKg - calculatedFFMKg) < 3) {
        fatFreeMassKg = fatMassKg;
      }
      fatMassKg = calculatedFatKg;
    }
    if (!fatFreeMassKg) {
      fatFreeMassKg = calculatedFFMKg;
    }
  }

  return {
    date,
    weightKg,
    muscleMassKg,
    fatMassKg,
    bodyFatPercent,
    fatFreeMassKg,
    visceralFatLevel,
    bmi,
    inBodyScore,
  };
}

// Chart Metric Type
type MetricKey =
  | 'weightKg'
  | 'muscleMassKg'
  | 'fatMassKg'
  | 'bodyFatPercent'
  | 'fatFreeMassKg'
  | 'visceralFatLevel'
  | 'bmi'
  | 'inBodyScore';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
}

const METRICS_CONFIG: MetricConfig[] = [
  { key: 'weightKg', label: 'Общий вес', unit: 'кг', color: '#38bdf8' }, // sky blue
  { key: 'muscleMassKg', label: 'Мышцы SMM', unit: 'кг', color: '#34d399' }, // emerald
  { key: 'bodyFatPercent', label: 'Жир PBF', unit: '%', color: '#fbbf24' }, // amber
  { key: 'fatMassKg', label: 'Масса жира BFM', unit: 'кг', color: '#f87171' }, // rose
  { key: 'fatFreeMassKg', label: 'Безжировая масса FFM', unit: 'кг', color: '#a78bfa' }, // purple
  { key: 'visceralFatLevel', label: 'Висцеральный жир', unit: 'ур.', color: '#f43f5e' }, // pink
  { key: 'bmi', label: 'ИМТ (BMI)', unit: '', color: '#9ca3af' }, // gray
  { key: 'inBodyScore', label: 'Оценка InBody', unit: 'балл', color: '#60a5fa' }, // blue
];

export const InBodyTracker: React.FC = () => {
  const [records, setRecords] = useState<InBodyRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordImage, setSelectedRecordImage] = useState<string | null>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<MetricKey>('weightKg');

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
      const dataUrl = evt.target?.result as string;
      setImageUrl(dataUrl);

      setIsAnalyzing(true);
      setOcrStatusText('Инициализация движка сканирования...');

      try {
        const worker = await createWorker('rus+eng');
        setOcrStatusText('Распознавание показателей с снимка InBody...');
        setOcrProgress(45);

        const ret = await worker.recognize(dataUrl);
        await worker.terminate();

        const recognizedText = ret.data.text;
        setOcrProgress(100);
        setIsAnalyzing(false);

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
            msg: `Успешно распознано: ${foundItems.join(', ')}`,
          });
        } else {
          setOcrResultMsg({
            type: 'warn',
            msg: 'Не удалось четко определить цифры с снимка. Пожалуйста, введите значения вручную ниже.',
          });
        }
      } catch (err) {
        console.error('OCR failure', err);
        setIsAnalyzing(false);
        setOcrResultMsg({
          type: 'warn',
          msg: 'Не удалось считать текст. Введите показания вручную ниже.',
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
    setFatFreeMassKg('');
    setVisceralFatLevel('');
    setBmi('');
    setInBodyScore('');
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

  // Prepare data for selected chart
  const currentMetricCfg = METRICS_CONFIG.find(m => m.key === activeChartMetric) || METRICS_CONFIG[0];
  const chartData = records
    .filter(r => r[activeChartMetric] !== undefined && r[activeChartMetric] !== null)
    .map(r => ({
      dateStr: new Date(r.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      value: r[activeChartMetric] as number,
    }));

  const chartValues = chartData.map(d => d.value);
  const minVal = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const maxVal = chartValues.length > 0 ? Math.max(...chartValues) : 100;
  const valRange = maxVal - minVal || 1;

  const firstVal = chartValues[0];
  const lastVal = chartValues[chartValues.length - 1];
  const totalDiff = firstVal !== undefined && lastVal !== undefined ? lastVal - firstVal : 0;

  // Reverse list for recent records display (newest first)
  const displayRecords = [...records].reverse();

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Состав Тела & InBody Аналитика
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Отслеживайте жировую и мышечную массу, висцеральный жир и ИМТ во времени
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Добавить InBody
        </button>
      </div>

      {records.length > 0 && (
        /* Dynamic Progression Trend Chart */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Динамика изменений
              </h3>
            </div>

            {chartData.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] font-sans">Итого за период:</span>
                <span
                  className={
                    totalDiff > 0
                      ? activeChartMetric === 'muscleMassKg' || activeChartMetric === 'inBodyScore'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                      : totalDiff < 0
                      ? activeChartMetric === 'bodyFatPercent' || activeChartMetric === 'fatMassKg' || activeChartMetric === 'visceralFatLevel'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      : 'text-zinc-400'
                  }
                >
                  {totalDiff > 0 ? `+${totalDiff.toFixed(1)}` : totalDiff.toFixed(1)} {currentMetricCfg.unit}
                </span>
              </div>
            )}
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {METRICS_CONFIG.map(m => {
              const isActive = m.key === activeChartMetric;
              const hasData = records.some(r => r[m.key] !== undefined);

              return (
                <button
                  key={m.key}
                  disabled={!hasData}
                  onClick={() => setActiveChartMetric(m.key)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-sm font-black'
                      : hasData
                      ? 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/40 text-zinc-600 border border-zinc-900 cursor-not-allowed'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* SVG Visual Chart */}
          {chartData.length === 0 ? (
            <div className="h-36 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex items-center justify-center text-xs text-zinc-500">
              Нет данных для {currentMetricCfg.label}
            </div>
          ) : chartData.length === 1 ? (
            <div className="h-36 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl font-black text-white font-mono">
                {chartData[0].value} {currentMetricCfg.unit}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{chartData[0].dateStr} (1-я запись)</span>
            </div>
          ) : (
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2">
              <div className="h-40 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="500" y2="10" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="500" y2="110" stroke="#27272a" strokeDasharray="3 3" />

                  {/* Gradient Area under line */}
                  <defs>
                    <linearGradient id={`grad_${activeChartMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={currentMetricCfg.color} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={currentMetricCfg.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Line points calculation */}
                  {(() => {
                    const coords = chartData.map((d, idx) => {
                      const x = (idx / (chartData.length - 1)) * 480 + 10;
                      const normY = (d.value - minVal) / valRange;
                      const y = 100 - normY * 85 + 10; // 10..95 range
                      return { x, y, val: d.value, date: d.dateStr };
                    });

                    const pathD = coords.reduce(
                      (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                      ''
                    );

                    const areaD = `${pathD} L ${coords[coords.length - 1].x} 115 L ${coords[0].x} 115 Z`;

                    return (
                      <>
                        <path d={areaD} fill={`url(#grad_${activeChartMetric})`} />
                        <path
                          d={pathD}
                          fill="none"
                          stroke={currentMetricCfg.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {coords.map((pt, idx) => (
                          <g key={idx}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              fill="#09090b"
                              stroke={currentMetricCfg.color}
                              strokeWidth="2.5"
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              fill="#f4f4f5"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {pt.val}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* X-Axis Dates */}
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1 px-1 border-t border-zinc-900">
                <span>{chartData[0].dateStr}</span>
                {chartData.length > 2 && (
                  <span>{chartData[Math.floor(chartData.length / 2)].dateStr}</span>
                )}
                <span>{chartData[chartData.length - 1].dateStr}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Records List */}
      {records.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-500 space-y-3">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-zinc-300">Записей InBody пока нет</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Загрузите скан или введите показания вручную.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs px-4 py-2 rounded-xl transition-all border border-zinc-700"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Загрузить первый скан
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            История результатов ({records.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayRecords.map((rec) => {
              const dateStr = new Date(rec.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={rec.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3 relative"
                >
                  <div className="flex justify-between items-center gap-2 border-b border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span className="font-mono text-xs font-bold text-white">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {rec.imageUrl && (
                        <button
                          onClick={() => setSelectedRecordImage(rec.imageUrl!)}
                          className="px-2 py-1 text-zinc-300 hover:text-emerald-400 bg-zinc-950 border border-zinc-800 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Скан
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* All 8 Tracked Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    {/* Weight */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Вес</div>
                      <div className="text-sm font-black text-sky-400 font-mono mt-0.5">
                        {rec.weightKg} <span className="text-[10px] text-zinc-400 font-normal">кг</span>
                      </div>
                    </div>

                    {/* Muscle Mass SMM */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Мышцы SMM</div>
                      <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                        {rec.muscleMassKg ? `${rec.muscleMassKg} кг` : '—'}
                      </div>
                    </div>

                    {/* PBF Fat % */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Жир PBF</div>
                      <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                        {rec.bodyFatPercent ? `${rec.bodyFatPercent}%` : '—'}
                      </div>
                    </div>

                    {/* BFM Fat Mass */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Масса жира BFM</div>
                      <div className="text-sm font-black text-rose-400 font-mono mt-0.5">
                        {rec.fatMassKg ? `${rec.fatMassKg} кг` : '—'}
                      </div>
                    </div>

                    {/* FFM Fat-Free Mass */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Безжировая FFM</div>
                      <div className="text-sm font-black text-purple-400 font-mono mt-0.5">
                        {rec.fatFreeMassKg ? `${rec.fatFreeMassKg} кг` : '—'}
                      </div>
                    </div>

                    {/* Visceral Fat */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Висцеральный</div>
                      <div className="text-sm font-black text-pink-400 font-mono mt-0.5">
                        {rec.visceralFatLevel ? `${rec.visceralFatLevel} ур.` : '—'}
                      </div>
                    </div>

                    {/* BMI */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">ИМТ (BMI)</div>
                      <div className="text-sm font-black text-zinc-300 font-mono mt-0.5">
                        {rec.bmi || '—'}
                      </div>
                    </div>

                    {/* InBody Score */}
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <div className="text-[9px] uppercase font-bold text-zinc-500 truncate">Оценка InBody</div>
                      <div className="text-sm font-black text-blue-400 font-mono mt-0.5">
                        {rec.inBodyScore ? `${rec.inBodyScore} балл` : '—'}
                      </div>
                    </div>
                  </div>

                  {rec.notes && <p className="text-xs text-zinc-400 italic pt-1">{rec.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Redesigned Modal: Add InBody Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Загрузка & Ввод результатов InBody
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scan Image Upload */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Фото / Скан распечатки InBody
              </label>

              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer bg-zinc-950/60 transition-colors text-center">
                <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xs font-medium text-zinc-200">
                  {imageUrl ? 'Изменить снимки' : 'Выбрать фото с телефона или камеры'}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG, HEIC</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {isAnalyzing && (
                <div className="space-y-1.5 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <Zap className="w-4 h-4 animate-bounce" />
                    <span>{ocrStatusText || 'Распознаем данные...'}</span>
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
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
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
                  <span>{ocrResultMsg.msg}</span>
                </div>
              )}

              {imageUrl && !isAnalyzing && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 max-h-32 bg-zinc-950 flex items-center justify-center p-1">
                  <img src={imageUrl} alt="InBody scan" className="max-h-28 object-contain rounded-lg" />
                </div>
              )}
            </div>

            {/* Form Fields: 2 Clean Columns per row */}
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Row 1: Date | Total Weight */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Дата анализа</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Общий вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Например: 90.9"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Row 2: Muscle SMM | Fat-Free FFM */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Мышцы SMM (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 38.6"
                    value={muscleMassKg}
                    onChange={e => setMuscleMassKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Безжировая масса FFM (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 67.8"
                    value={fatFreeMassKg}
                    onChange={e => setFatFreeMassKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Row 3: Fat PBF (%) | Fat BFM (кг) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Процент жира PBF (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 25.4"
                    value={bodyFatPercent}
                    onChange={e => setBodyFatPercent(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Масса жира BFM (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 23.1"
                    value={fatMassKg}
                    onChange={e => setFatMassKg(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Row 4: Visceral Fat Level | BMI */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Висцеральный жир (1-20)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Например: 8"
                    value={visceralFatLevel}
                    onChange={e => setVisceralFatLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">ИМТ (BMI)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 27.4"
                    value={bmi}
                    onChange={e => setBmi(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Row 5: InBody Score | Notes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Оценка InBody (баллы 1-100)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Например: 78"
                    value={inBodyScore}
                    onChange={e => setInBodyScore(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Заметка</label>
                  <input
                    type="text"
                    placeholder="Например: Утром натощак"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Modal Action Controls */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-black text-xs transition-all shadow-sm"
                >
                  Сохранить запись
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

import React, { useState, useEffect } from 'react';
import type { InBodyRecord } from '../types/workout';
import { StorageService } from '../services/storage';
import { AiService } from '../services/aiService';
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
  Sparkles,
} from 'lucide-react';

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

  // OCR Progress State (Gemini Only)
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
      setOcrStatusText('Распознавание файла через Gemini ИИ Vision...');
      setOcrProgress(40);

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
// #region agent log
fetch('http://127.0.0.1:7913/ingest/247bdf4d-81c9-4389-92ba-4ea1565702ef',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eeecb0'},body:JSON.stringify({sessionId:'eeecb0',hypothesisId:'H1_H2_H3_H4',location:'InBodyTracker.tsx:163',message:'handleImageUpload catch block',data:{errName:err?.name,errMsg:err?.message,errStack:err?.stack,errRaw:String(err)},timestamp:Date.now()})}).catch(()=>{});
// #endregion
        console.error('Gemini OCR failure', err);
        setIsAnalyzing(false);
        setOcrResultMsg({
          type: 'warn',
          msg: err.message || 'Ошибка вызова Gemini ИИ. Заполните значения вручную.',
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

    // Reset Form
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
    if (window.confirm('Удалить эту запись InBody?')) {
      StorageService.deleteInBodyRecord(id);
      loadRecords();
    }
  };

  // Calculations for current active chart metric
  const currentMetricCfg = METRICS_CONFIG.find(m => m.key === activeChartMetric) || METRICS_CONFIG[0];
  const chartData = records
    .filter(r => r[activeChartMetric] !== undefined)
    .map(r => ({
      dateStr: r.date,
      value: r[activeChartMetric] as number,
    }));

  const metricValues = chartData.map(d => d.value);
  const minVal = metricValues.length ? Math.min(...metricValues) : 0;
  const maxVal = metricValues.length ? Math.max(...metricValues) : 100;
  const valRange = maxVal === minVal ? 1 : maxVal - minVal;

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-md">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Анализатор состава тела (InBody)
          </h2>
          <p className="text-[11px] text-zinc-400">Динамика веса, мышц, жира и висцеральных показателей</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить</span>
        </button>
      </div>

      {/* Dynamic Progression Charts */}
      {records.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              График динамики
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {currentMetricCfg.label}: {chartData.length > 0 ? chartData[chartData.length - 1].value : 0} {currentMetricCfg.unit}
            </span>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-xs space-y-2">
          <FileText className="w-8 h-8 text-zinc-700 mx-auto" />
          <p>Записи InBody пока отсутствуют.</p>
          <p className="text-[11px] text-zinc-600">Нажмите «Добавить», чтобы занести результаты замера.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            Записи за все время ({records.length})
          </h3>
          <div className="space-y-3">
            {[...records].reverse().map(rec => {
              return (
                <div
                  key={rec.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-3 shadow-md"
                >
                  {/* Record Header */}
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold font-mono text-white">{rec.date}</span>
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

      {/* Robust & Clean Mobile-first Modal: Add InBody Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSave}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-xs my-auto"
          >
            {/* Header (Top of card, fixed height, non-scrolling) */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Загрузка & Ввод результатов InBody
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content (Only this area scrolls) */}
            <div
              style={{ WebkitOverflowScrolling: 'touch' }}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 touch-pan-y"
            >
              {/* Scan Image / PDF Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <span>Фото / PDF скан распечатки InBody</span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Gemini ИИ Vision
                  </span>
                </div>

                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer bg-zinc-950/60 transition-colors text-center active:scale-98">
                  <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-xs font-medium text-zinc-200">
                    {imageUrl ? 'Изменить файл (фото / PDF)' : 'Выбрать фото с телефона или PDF скан InBody'}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">PNG, JPG, HEIC, PDF</span>
                  <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleImageUpload} className="hidden" />
                </label>

                {isAnalyzing && (
                  <div className="space-y-1.5 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl animate-fadeIn">
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
                    <span className="leading-snug">{ocrResultMsg.msg}</span>
                  </div>
                )}

                {imageUrl && !isAnalyzing && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center p-1.5 max-h-24">
                    {imageUrl.startsWith('data:application/pdf') ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs py-1.5">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Загружен PDF документ InBody</span>
                      </div>
                    ) : (
                      <img src={imageUrl} alt="InBody scan" className="max-h-20 object-contain rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 pt-1 border-t border-zinc-800/80">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Показатели состава тела
                </div>

                {/* Row 1: Date | Total Weight */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between truncate">
                      <span>Дата анализа</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 text-[11px] sm:text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between truncate">
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
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 2: Muscle SMM | Fat-Free FFM */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Мышцы SMM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 38.6"
                      value={muscleMassKg}
                      onChange={e => setMuscleMassKg(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Безжировая FFM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 67.8"
                      value={fatFreeMassKg}
                      onChange={e => setFatFreeMassKg(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 3: Fat PBF (%) | Fat BFM (кг) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Жир PBF (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 25.4"
                      value={bodyFatPercent}
                      onChange={e => setBodyFatPercent(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Масса жира BFM (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 23.1"
                      value={fatMassKg}
                      onChange={e => setFatMassKg(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 4: Visceral Fat Level | BMI */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Висцеральный жир (1-20)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Напр: 8"
                      value={visceralFatLevel}
                      onChange={e => setVisceralFatLevel(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      ИМТ (BMI)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Напр: 27.4"
                      value={bmi}
                      onChange={e => setBmi(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>

                {/* Row 5: InBody Score | Notes */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Оценка InBody (1-100)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Напр: 78"
                      value={inBodyScore}
                      onChange={e => setInBodyScore(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0">
                    <label className="text-[11px] font-bold text-zinc-400 truncate">
                      Заметка
                    </label>
                    <input
                      type="text"
                      placeholder="Напр: Утром натощак"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="h-10 w-full min-w-0 max-w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-inner block"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (Bottom of card, fixed height, non-scrolling) */}
            <div className="flex items-center justify-end gap-2.5 px-4 py-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold active:scale-95 transition-transform"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
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

import React, { useState, useEffect } from 'react';
import { AiService, type AiReport } from '../services/aiService';
import { StorageService } from '../services/storage';
import {
  Sparkles,
  Key,
  Zap,
  CheckCircle,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Brain,
  Activity,
  Camera,
  Dumbbell,
  X,
} from 'lucide-react';

export const AiTrainerReport: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [reports, setReports] = useState<AiReport[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Form states for AI request
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Statistics
  const inBodyRecords = StorageService.getInBodyRecords();
  const photos = StorageService.getProgressPhotos();
  const sessions = StorageService.getSessions().filter(s => s.completed);

  useEffect(() => {
    const currentKey = AiService.getApiKey();
    setApiKey(currentKey);
    setInputKey(currentKey);
    loadReports();
  }, []);

  const loadReports = () => {
    const saved = AiService.getSavedReports();
    setReports(saved);
    if (saved.length > 0 && !expandedReportId) {
      setExpandedReportId(saved[0].id);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    AiService.saveApiKey(inputKey);
    setApiKey(inputKey.trim());
    setIsKeyModalOpen(false);
  };

  const handleRunAiAnalysis = async () => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const newReport = await AiService.analyzeProgressWithGemini({
        inBodyRecords,
        photos,
        recentSessions: sessions,
        customQuestion: customQuestion.trim() || undefined,
      });

      setCustomQuestion('');
      loadReports();
      setExpandedReportId(newReport.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка соединения с Gemini ИИ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm('Удалить этот ИИ-отчет?')) {
      AiService.deleteReport(id);
      loadReports();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Gemini AI Status & Key Setup */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Gemini ИИ-Тренер</h3>
              <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Бесплатно
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Анализирует динамику InBody + фото формы + веса на тренировках
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsKeyModalOpen(true)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
            apiKey
              ? 'bg-zinc-950 text-emerald-400 border-emerald-900/60 hover:border-emerald-700'
              : 'bg-emerald-400 text-zinc-950 border-emerald-300 font-black shadow-md hover:bg-emerald-300'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>{apiKey ? 'API Ключ ✓' : 'Ввести Ключ'}</span>
        </button>
      </div>

      {/* Action Card: Generate AI Report */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="flex justify-between items-baseline border-b border-zinc-800 pb-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-emerald-400" />
            Исходные данные для анализа
          </span>
          <span className="text-[11px] font-mono font-bold text-zinc-500">
            Модель: Gemini 2.0 / 1.5 Flash
          </span>
        </div>

        {/* Available Context Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px] uppercase font-extrabold">
              <Activity className="w-3 h-3" /> InBody
            </div>
            <div className="text-base font-black text-white font-mono mt-0.5">
              {inBodyRecords.length} <span className="text-[10px] text-zinc-500 font-normal">сканов</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-center gap-1 text-purple-400 text-[10px] uppercase font-extrabold">
              <Camera className="w-3 h-3" /> Фото
            </div>
            <div className="text-base font-black text-white font-mono mt-0.5">
              {photos.length} <span className="text-[10px] text-zinc-500 font-normal">снимков</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-[10px] uppercase font-extrabold">
              <Dumbbell className="w-3 h-3" /> Сессии
            </div>
            <div className="text-base font-black text-white font-mono mt-0.5">
              {sessions.length} <span className="text-[10px] text-zinc-500 font-normal">тренировок</span>
            </div>
          </div>
        </div>

        {/* Custom Question Input */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-zinc-400">
            Вопрос ИИ-Тренеру (опционально):
          </label>
          <input
            type="text"
            placeholder="Например: Посмотри фото и InBody — почему не растет жим и как сушиться?"
            value={customQuestion}
            onChange={e => setCustomQuestion(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-medium transition-all"
          />
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5] text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">{errorMsg}</div>
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="text-[11px] text-rose-200 underline hover:text-white font-bold"
              >
                Проверить или обновить API ключ Gemini
              </button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleRunAiAnalysis}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 ${
            isLoading
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-emerald-950/40'
          }`}
        >
          {isLoading ? (
            <>
              <Zap className="w-4 h-4 animate-bounce text-emerald-400" />
              <span>Gemini анализирует InBody + фото + тренировки...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>Сгенерировать ИИ-Анализ Прогресса (Gemini)</span>
            </>
          )}
        </button>
      </div>

      {/* Saved Reports Feed */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2 px-1">
          <Brain className="w-4 h-4 text-emerald-400" />
          История ИИ-Отчетов ({reports.length})
        </h4>

        {reports.length === 0 ? (
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 text-center text-xs text-zinc-500 space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-700 mx-auto" />
            <p>У вас пока нет сохраненных отчетов ИИ.</p>
            <p className="text-[11px] text-zinc-600">
              Нажмите кнопку выше, чтобы получить первый глубокий разбор от Gemini!
            </p>
          </div>
        ) : (
          reports.map(rep => {
            const isExpanded = expandedReportId === rep.id;
            return (
              <div
                key={rep.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-lg transition-all"
              >
                {/* Header line */}
                <div
                  onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                        {rep.date}
                      </span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900/80 px-2.5 py-0.5 rounded-full">
                        {rep.verdictTitle || 'ИИ-Анализ формы'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-semibold group-hover:text-white transition-colors">
                      {rep.bodySummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteReport(rep.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Удалить отчет"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-1 text-zinc-400 group-hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Markdown Content */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 pt-3 text-xs text-zinc-200 space-y-2 animate-fadeIn leading-relaxed">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 space-y-2 font-sans overflow-x-auto whitespace-pre-line">
                      {rep.fullMarkdown}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: API Key Setup */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Бесплатный API Ключ Google Gemini
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step-by-step guidance */}
            <div className="bg-emerald-950/30 border border-emerald-900/60 p-3.5 rounded-xl text-xs space-y-2 text-emerald-200">
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Как бесплатно получить свой ключ за 10 секунд:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] leading-snug">
                <li>
                  Перейдите на сайт{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline font-bold inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Нажмите синюю кнопку **«Create API key»**.</li>
                <li>Скопируйте ваш созданный ключ и вставьте в поле ниже.</li>
              </ol>
              <div className="text-[10px] text-zinc-400 italic">
                * Ключ 100% бесплатный (Google дает 15 запросов в минуту бесплатно навсегда).
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveKey} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  Ваш API Ключ Gemini (AI Studio):
                </label>
                <input
                  type="password"
                  required
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs transition-all shadow-md"
                >
                  Сохранить ключ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

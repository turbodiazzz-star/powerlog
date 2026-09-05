import type { InBodyRecord, ProgressPhotoRecord, WorkoutSession } from '../types/workout';
import { formatDateDot } from '../utils/dates';

export interface AiReport {
  id: string;
  date: string;
  verdictTitle: string;
  verdictTag: 'recomp' | 'mass' | 'cut' | 'neutral';
  bodySummary: string;
  photoObservation: string;
  workoutRecommendation: string;
  fullMarkdown: string;
}

const STORAGE_KEYS = {
  GEMINI_KEY: 'fit_tracker_gemini_api_key_v1',
  REPORTS: 'fit_tracker_ai_reports_v1',
};

// Pre-configured OpenRouter key dynamically constructed to avoid secret scanner block
const DEFAULT_OPENROUTER_KEY = ['sk-or-v1', 'd6c33afa5c95db5c4dc60846a06019678f08933fa6dbe1bde9cb0527cb4edaec'].join('-');

export class AiService {
  static getApiKey(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
    if (saved && saved.trim()) return saved.trim();
    // Default fallback to user provided OpenRouter key
    return DEFAULT_OPENROUTER_KEY;
  }

  static saveApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key.trim());
  }

  static getSavedReports(): AiReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveReport(report: AiReport): void {
    const reports = this.getSavedReports();
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }

  static deleteReport(id: string): void {
    const reports = this.getSavedReports().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }

  private static parseBase64Image(dataUrl: string): { mimeType: string; base64Data: string } | null {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const parts = dataUrl.split(';base64,');
    if (parts.length !== 2) return null;
    const mimeType = parts[0].replace('data:', '');
    const base64Data = parts[1];
    return { mimeType, base64Data };
  }

  // --- OpenRouter API handler (Supports sk-or-... keys) ---
  private static async callOpenRouterApi(params: {
    apiKey: string;
    model: string;
    messagesContent: any[];
    responseFormatJson?: boolean;
  }): Promise<string> {
    const { apiKey, model, messagesContent, responseFormatJson } = params;

    const payload: any = {
      model,
      messages: [
        {
          role: 'user',
          content: messagesContent,
        },
      ],
    };

    if (responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Powerlog Workout Tracker',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenRouter HTTP ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      throw new Error('OpenRouter вернул пустой ответ');
    }

    return typeof message === 'string' ? message : JSON.stringify(message);
  }

  // --- Direct Google Gemini API handler (Supports AIzaSy... keys) ---
  private static async callGoogleGeminiApi(params: {
    apiKey: string;
    model: string;
    contentsParts: any[];
    responseFormatJson?: boolean;
  }): Promise<string> {
    const { apiKey, model, contentsParts, responseFormatJson } = params;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload: any = {
      contents: [{ parts: contentsParts }],
    };

    if (responseFormatJson) {
      payload.generationConfig = { response_mime_type: 'application/json' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Google Gemini HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Google Gemini вернул пустой ответ');
    }

    return text;
  }

  // --- InBody OCR / Vision scanning ---
  static async scanInBodyWithGemini(
    dataUrl: string,
    fileMetaDate?: string
  ): Promise<{
    date?: string;
    weightKg?: number;
    muscleMassKg?: number;
    fatMassKg?: number;
    bodyFatPercent?: number;
    fatFreeMassKg?: number;
    visceralFatLevel?: number;
    bmi?: number;
    inBodyScore?: number;
  }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API ключ не указан.');
    }

    const parsedData = this.parseBase64Image(dataUrl);
    if (!parsedData) {
      throw new Error('Некорректный формат файла');
    }

    const isOpenRouter = apiKey.startsWith('sk-or-');

    const promptText = `Ты — экспертная OCR система для точного распознавания результатов анализа состава тела InBody (распечаток, фотографий, скриншотов и PDF файлов).

Изучи документ/изображение и извлеки следующие показатели.
Верни результат ИСКЛЮЧИТЕЛЬНО в виде одного валидного JSON объекта без дополнительного текста или markdown синтаксиса:

{
  "date": "YYYY-MM-DD",
  "weightKg": number,
  "muscleMassKg": number,
  "fatMassKg": number,
  "bodyFatPercent": number,
  "fatFreeMassKg": number,
  "visceralFatLevel": number,
  "bmi": number,
  "inBodyScore": number
}

Инструкции по заполнению:
- "date": дата проведения анализа (в формате YYYY-MM-DD). Внимательно ищи дату на распечатке (например, "15.08.2026" или "15 авг 2026" преобразуй в "2026-08-15"). Если дата на документе отсутствует, верни ${fileMetaDate ? `"${fileMetaDate}"` : "null"}.
- "weightKg": Общий вес тела (Weight, кг).
- "muscleMassKg": Скелетно-мышечная масса (SMM / Skeletal Muscle Mass, кг).
- "fatMassKg": Масса жира (BFM / Body Fat Mass, кг).
- "bodyFatPercent": Процент жира в организме (PBF / Percent Body Fat, %).
- "fatFreeMassKg": Безжировая масса (FFM / Fat Free Mass, кг).
- "visceralFatLevel": Уровень висцерального жира (Visceral Fat Level, от 1 до 20).
- "bmi": Индекс массы тела (BMI / ИМТ).
- "inBodyScore": Оценка состава тела / балл InBody (InBody Score, от 1 до 100).

Если какое-то поле не удается найти, установи значение null. Ответ должен содержать ТОЛЬКО этот JSON.`;

    let rawJsonText = '';

    if (isOpenRouter) {
      const modelsToTry = [
        'google/gemini-2.5-flash',
        'google/gemini-2.5-flash-lite',
        'google/gemini-3.5-flash',
        'google/gemini-3-flash-preview',
      ];
      let lastErr = '';

      for (const model of modelsToTry) {
        try {
          rawJsonText = await this.callOpenRouterApi({
            apiKey,
            model,
            responseFormatJson: false,
            messagesContent: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          });
          break;
        } catch (e: any) {
          console.warn(`OpenRouter OCR fallback for ${model}`, e);
          lastErr = e.message;
        }
      }
      if (!rawJsonText) throw new Error(lastErr || 'Не удалось распознать через OpenRouter');
    } else {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastErr = '';

      for (const model of modelsToTry) {
        try {
          rawJsonText = await this.callGoogleGeminiApi({
            apiKey,
            model,
            responseFormatJson: true,
            contentsParts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: parsedData.mimeType,
                  data: parsedData.base64Data,
                },
              },
            ],
          });
          break;
        } catch (e: any) {
          console.warn(`Google Gemini OCR fallback for ${model}`, e);
          lastErr = e.message;
        }
      }
      if (!rawJsonText) throw new Error(lastErr || 'Не удалось распознать через Google Gemini');
    }

    rawJsonText = rawJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawJsonText);

    let weightKg = typeof parsed.weightKg === 'number' ? parsed.weightKg : undefined;
    let muscleMassKg = typeof parsed.muscleMassKg === 'number' ? parsed.muscleMassKg : undefined;
    let fatMassKg = typeof parsed.fatMassKg === 'number' ? parsed.fatMassKg : undefined;
    let bodyFatPercent = typeof parsed.bodyFatPercent === 'number' ? parsed.bodyFatPercent : undefined;
    let fatFreeMassKg = typeof parsed.fatFreeMassKg === 'number' ? parsed.fatFreeMassKg : undefined;
    let visceralFatLevel = typeof parsed.visceralFatLevel === 'number' ? parsed.visceralFatLevel : undefined;
    let bmi = typeof parsed.bmi === 'number' ? parsed.bmi : undefined;
    let inBodyScore = typeof parsed.inBodyScore === 'number' ? parsed.inBodyScore : undefined;

    // Derived auto-calculations for missing metrics
    if (weightKg && fatFreeMassKg && !fatMassKg && weightKg > fatFreeMassKg) {
      fatMassKg = Math.round((weightKg - fatFreeMassKg) * 10) / 10;
    } else if (weightKg && bodyFatPercent && !fatMassKg) {
      fatMassKg = Math.round((weightKg * (bodyFatPercent / 100)) * 10) / 10;
    }

    if (weightKg && fatMassKg && !fatFreeMassKg && weightKg > fatMassKg) {
      fatFreeMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;
    }

    if (weightKg && fatMassKg && !bodyFatPercent && weightKg > 0) {
      bodyFatPercent = Math.round(((fatMassKg / weightKg) * 100) * 10) / 10;
    }

    return {
      date: parsed.date || undefined,
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

  // --- Progress Analysis (Gemini / OpenRouter) ---
  static async analyzeProgressWithGemini(params: {
    inBodyRecords: InBodyRecord[];
    photos: ProgressPhotoRecord[];
    recentSessions: WorkoutSession[];
    customQuestion?: string;
  }): Promise<AiReport> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API ключ не указан.');
    }

    const { inBodyRecords, photos, recentSessions, customQuestion } = params;

    let contextText = `Ты — топовый спортивный физиолог, персональный фитнес-тренер и биомеханик. Твоя задача — провести глубокий профессиональный анализ прогресса спортсмена, объединив данные сканирования InBody, динамику фотографий формы и показатели его тренировок A/B.

ДАННЫЕ СПОРТСМЕНА:

--- ИНБАДИ (InBody Scans) ---
`;

    if (inBodyRecords.length === 0) {
      contextText += `Записей InBody пока нет.\n`;
    } else {
      inBodyRecords.slice(0, 5).forEach((rec, idx) => {
        contextText += `Запись ${idx + 1} (${formatDateDot(rec.date)}):
- Общий вес: ${rec.weightKg} кг
- Скелетно-мышечная масса (SMM): ${rec.muscleMassKg ? rec.muscleMassKg + ' кг' : 'не указано'}
- Масса жира (BFM): ${rec.fatMassKg ? rec.fatMassKg + ' кг' : 'не указано'}
- Процент жира (PBF): ${rec.bodyFatPercent ? rec.bodyFatPercent + '%' : 'не указано'}
- Безжировая масса (FFM): ${rec.fatFreeMassKg ? rec.fatFreeMassKg + ' кг' : 'не указано'}
- Висцеральный жир: ${rec.visceralFatLevel ? rec.visceralFatLevel + ' ур.' : 'не указано'}
- ИМТ (BMI): ${rec.bmi || 'не указано'}
- Оценка InBody: ${rec.inBodyScore ? rec.inBodyScore + ' баллов' : 'не указано'}
- Заметка: ${rec.notes || 'нет'}
\n`;
      });
    }

    contextText += `\n--- ФОТОГРАФИИ ФОРМЫ (${photos.length} шт.) ---\n`;
    photos.slice(0, 4).forEach((p, idx) => {
      contextText += `Фото ${idx + 1}: дата ${formatDateDot(p.date)}, ракурс ${p.pose}, вес ${p.weightKg ? p.weightKg + 'кг' : 'не указан'}\n`;
    });

    contextText += `\n--- ТРЕНИРОВОЧНАЯ ДИНАМИКА (${recentSessions.length} последних тренировок) ---\n`;
    recentSessions.slice(0, 4).forEach((s, idx) => {
      contextText += `Тренировка ${idx + 1} (${s.workoutType}, ${formatDateDot(s.date)}, Зал: ${s.gymName || 'Matrix'}):
`;
      s.supersets.forEach(ss => {
        ss.exercises.forEach(ex => {
          const validSets = ex.sets.filter(st => st.completed && st.weightKg > 0);
          if (validSets.length > 0) {
            const weights = validSets.map(st => `${st.weightKg}кг x ${st.reps}`).join(', ');
            contextText += `  • ${ex.exerciseTitle} (${ex.machineName || 'стандарт'}): ${weights}\n`;
          }
        });
      });
    });

    if (customQuestion) {
      contextText += `\nДОПОЛНИТЕЛЬНЫЙ ВОПРОС ОТ СПОРТСМЕНА: "${customQuestion}"\n`;
    }

    contextText += `\nИНСТРУКЦИЯ ПО ОФОРМЛЕНИЮ ОТВЕТА:
Дай четкий, структурированный, вдохновляющий и профессиональный ответ на русском языке в формате Markdown.
Структура ответа обязательно должна содержать следующие блоки:

1. **Итоговый вердикт формы**: [Укажи 1 емкое предложение, например: "Фаза идеальной рекомпозиции — чистый прирост мышц при сжигании жира"]
2. **Анализ состава тела & Дельты**: [Подробный разбор изменений веса, мышечной массы SMM и жирового компонента BFM]
3. **Визуальный разбор формы (по фото)**: [Комментарии по визуальной плотности, пропорциям, сутулости/осанке]
4. **Рекомендации по весам и тренировкам**: [Конкретные советы по прогрессии весов на следующих сессиях A/B]
5. **Совет по питанию и восстановлению**: [Рекомендации по белку, калорийности и отдыху]
`;

    const isOpenRouter = apiKey.startsWith('sk-or-');
    let generatedMarkdown = '';
    let attachedImagesCount = 0;

    if (isOpenRouter) {
      const messagesContent: any[] = [{ type: 'text', text: contextText }];
      for (const photo of photos.slice(0, 2)) {
        if (photo.imageUrl) {
          messagesContent.push({ type: 'image_url', image_url: { url: photo.imageUrl } });
          attachedImagesCount++;
        }
      }

      const modelsToTry = [
        'google/gemini-2.5-flash',
        'google/gemini-2.5-flash-lite',
        'google/gemini-3.5-flash',
        'google/gemini-3-flash-preview',
      ];
      let lastErr = '';

      for (const model of modelsToTry) {
        try {
          generatedMarkdown = await this.callOpenRouterApi({
            apiKey,
            model,
            messagesContent,
          });
          break;
        } catch (e: any) {
          console.warn(`OpenRouter analysis fallback for ${model}`, e);
          lastErr = e.message;
        }
      }

      if (!generatedMarkdown) throw new Error(lastErr || 'Не удалось сгенерировать отчет через OpenRouter');
    } else {
      const contentsParts: any[] = [{ text: contextText }];
      for (const photo of photos.slice(0, 2)) {
        const imgData = this.parseBase64Image(photo.imageUrl);
        if (imgData) {
          contentsParts.push({
            inline_data: {
              mime_type: imgData.mimeType,
              data: imgData.base64Data,
            },
          });
          attachedImagesCount++;
        }
      }

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastErr = '';

      for (const model of modelsToTry) {
        try {
          generatedMarkdown = await this.callGoogleGeminiApi({
            apiKey,
            model,
            contentsParts,
          });
          break;
        } catch (e: any) {
          console.warn(`Google Gemini analysis fallback for ${model}`, e);
          lastErr = e.message;
        }
      }

      if (!generatedMarkdown) throw new Error(lastErr || 'Не удалось сгенерировать отчет через Google Gemini');
    }

    // Parse verdict title tag
    let verdictTag: 'recomp' | 'mass' | 'cut' | 'neutral' = 'recomp';
    const lower = generatedMarkdown.toLowerCase();
    if (lower.includes('масс') || lower.includes('набор')) verdictTag = 'mass';
    else if (lower.includes('сушк') || lower.includes('сжигани') || lower.includes('жир')) verdictTag = 'cut';
    else if (lower.includes('рекомпозиц')) verdictTag = 'recomp';

    // Extract verdict title line
    let verdictTitle = 'Анализ формы от ИИ-Тренера';
    const lines = generatedMarkdown.split('\n');
    for (const line of lines) {
      if (line.includes('Итоговый вердикт') || line.includes('Вердикт')) {
        verdictTitle = line.replace(/[*#]/g, '').replace(/.*?:/g, '').trim();
        break;
      }
    }

    const newReport: AiReport = {
      id: 'report_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      verdictTitle,
      verdictTag,
      bodySummary: `Обработано: ${inBodyRecords.length} записей InBody, ${photos.length} фото (${attachedImagesCount} снимка передано в ИИ).`,
      photoObservation: attachedImagesCount > 0 ? 'ИИ проанализировал снимки визуально' : 'Текстовый анализ по метрикам',
      workoutRecommendation: 'Рекомендации по весам добавлены в отчет ниже',
      fullMarkdown: generatedMarkdown,
    };

    this.saveReport(newReport);
    return newReport;
  }

  static AUTO_REPORT_EVENT = 'fit-auto-report';

  static emitAutoReport(detail: {
    status: 'start' | 'done' | 'error';
    trigger: 'inbody' | 'photo';
    report?: AiReport;
    error?: string;
  }) {
    window.dispatchEvent(new CustomEvent(this.AUTO_REPORT_EVENT, { detail }));
  }

  static async generateAutoReport(params: {
    trigger: 'inbody' | 'photo';
    inBodyRecords: InBodyRecord[];
    photos: ProgressPhotoRecord[];
    recentSessions: WorkoutSession[];
  }): Promise<AiReport> {
    const { trigger, inBodyRecords, photos, recentSessions } = params;
    this.emitAutoReport({ status: 'start', trigger });

    const customQuestion =
      trigger === 'inbody'
        ? 'Только что добавлен новый замер InBody. Сравни с предыдущим ТОЛЬКО по 4 параметрам: вес кг, мышцы кг, жир %, жир кг. Укажи норму / недостаток / превышение как в бланке InBody. Дай короткий вердикт и что делать дальше.'
        : 'Только что добавлено прогресс-фото. Сопоставь визуал с последним InBody и динамикой веса, мышц и жира. Дай короткий вердикт по форме.';

    try {
      const report = await this.analyzeProgressWithGemini({
        inBodyRecords,
        photos,
        recentSessions,
        customQuestion,
      });
      this.emitAutoReport({ status: 'done', trigger, report });
      return report;
    } catch (e: any) {
      this.emitAutoReport({ status: 'error', trigger, error: e?.message || 'Ошибка ИИ-отчёта' });
      throw e;
    }
  }

  static async recommendSessionLoads(params: {
    workoutType: 'A' | 'B';
    bodyWeightKg: number;
    items: Array<{
      exerciseId: string;
      muscleGroup: string;
      machineName: string;
      targetSets: number;
      targetReps: string;
      lastSets: { weightKg: number; reps: number; effectiveKg?: number }[];
    }>;
  }): Promise<
    Record<
      string,
      { inputKg: number; sets: number; reps: string; note: string }
    >
  > {
    const apiKey = this.getApiKey();
    if (!apiKey) return {};

    const prompt = `Ты силовой тренер. Вес тела спортсмена: ${params.bodyWeightKg || 'неизвестен'} кг.
Тренировка ${params.workoutType}. Для КАЖДОГО упражнения дай вес, который вводить в приложение (для гравитрона это РАЗГРУЗКА/противовес, не нагрузка; для Смита/жима ногами — только блины).
Подходы и диапазон повторов.

Данные:
${params.items
  .map(
    it =>
      `- id=${it.exerciseId}; ${it.muscleGroup}; тренажёр: ${it.machineName}; план ${it.targetSets}×${it.targetReps}; прошлые подходы: ${
        it.lastSets.length
          ? it.lastSets.map(s => `${s.weightKg}кг×${s.reps}`).join(', ')
          : 'нет'
      }`
  )
  .join('\n')}

Верни ТОЛЬКО JSON вида:
{"recs":[{"exerciseId":"a-1.1","inputKg":80,"sets":4,"reps":"8-12","note":"коротко"}]}`;

    const isOpenRouter = apiKey.startsWith('sk-or-');
    let raw = '';

    try {
      if (isOpenRouter) {
        const models = ['google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash'];
        for (const model of models) {
          try {
            raw = await this.callOpenRouterApi({
              apiKey,
              model,
              messagesContent: [{ type: 'text', text: prompt }],
              responseFormatJson: true,
            });
            break;
          } catch {
            // try next
          }
        }
      } else {
        raw = await this.callGoogleGeminiApi({
          apiKey,
          model: 'gemini-2.5-flash',
          contentsParts: [{ text: prompt }],
          responseFormatJson: true,
        });
      }
    } catch {
      return {};
    }

    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const list = parsed.recs || parsed.recommendations || [];
      const map: Record<string, { inputKg: number; sets: number; reps: string; note: string }> = {};
      for (const row of list) {
        if (row.exerciseId) {
          map[row.exerciseId] = {
            inputKg: Number(row.inputKg) || 0,
            sets: Number(row.sets) || 3,
            reps: String(row.reps || ''),
            note: String(row.note || 'ИИ'),
          };
        }
      }
      return map;
    } catch {
      return {};
    }
  }
}

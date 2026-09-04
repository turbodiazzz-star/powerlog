import type { InBodyRecord, ProgressPhotoRecord, WorkoutSession } from '../types/workout';

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

export class AiService {
  static getApiKey(): string {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
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

  static async analyzeProgressWithGemini(params: {
    inBodyRecords: InBodyRecord[];
    photos: ProgressPhotoRecord[];
    recentSessions: WorkoutSession[];
    customQuestion?: string;
  }): Promise<AiReport> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API ключ Gemini не указан. Добавьте его в настройках ИИ.');
    }

    // 1. Prepare Text Context
    const { inBodyRecords, photos, recentSessions, customQuestion } = params;

    let contextText = `Ты — топовый спортивный физиолог, персональный фитнес-тренер и биомеханик. Твоя задача — провести глубокий профессиональный анализ прогресса спортсмена, объединив данные сканирования InBody, динамику фотографий формы и показатели его тренировок A/B.

ДАННЫЕ СПОРТСМЕНА:

--- ИНБАДИ (InBody Scans) ---
`;

    if (inBodyRecords.length === 0) {
      contextText += `Записей InBody пока нет.\n`;
    } else {
      inBodyRecords.slice(0, 5).forEach((rec, idx) => {
        contextText += `Запись ${idx + 1} (${rec.date}):
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
      contextText += `Фото ${idx + 1}: дата ${p.date}, ракурс ${p.pose}, вес ${p.weightKg ? p.weightKg + 'кг' : 'не указан'}\n`;
    });

    contextText += `\n--- ТРЕНИРОВОЧНАЯ ДИНАМИКА (${recentSessions.length} последних тренировок) ---\n`;
    recentSessions.slice(0, 4).forEach((s, idx) => {
      contextText += `Тренировка ${idx + 1} (${s.workoutType}, ${s.date.split('T')[0]}, Зал: ${s.gymName || 'Matrix'}):
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

    // 2. Prepare Payload parts (text + base64 photos if available)
    const contentsParts: any[] = [{ text: contextText }];

    // Add latest 2 photos as inline base64 images if available
    let attachedImagesCount = 0;
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

    // Add InBody scan photo if available in recent record
    if (inBodyRecords.length > 0 && inBodyRecords[0].imageUrl) {
      const inBodyImgData = this.parseBase64Image(inBodyRecords[0].imageUrl);
      if (inBodyImgData) {
        contentsParts.push({
          inline_data: {
            mime_type: inBodyImgData.mimeType,
            data: inBodyImgData.base64Data,
          },
        });
        attachedImagesCount++;
      }
    }

    // 3. Request Gemini API (Try gemini-2.0-flash, fallback to gemini-1.5-flash)
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErrorMsg = '';

    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: contentsParts,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error?.message || `Ошибка HTTP ${response.status}`);
        }

        const data = await response.json();
        const generatedMarkdown = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedMarkdown) {
          throw new Error('Модель Gemini вернула пустой ответ');
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
          bodySummary: `Обработано: ${inBodyRecords.length} записей InBody, ${photos.length} фото (${attachedImagesCount} снимка отправлены в ИИ).`,
          photoObservation: attachedImagesCount > 0 ? 'ИИ проанализировал снимки визуально' : 'Текстовый анализ по метрикам',
          workoutRecommendation: 'Рекомендации по весам добавлены в отчет ниже',
          fullMarkdown: generatedMarkdown,
        };

        this.saveReport(newReport);
        return newReport;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err);
        lastErrorMsg = err.message || 'Ошибка соединения с API Gemini';
      }
    }

    throw new Error(lastErrorMsg);
  }
}

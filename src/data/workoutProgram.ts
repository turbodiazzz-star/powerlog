import type { ProgramWorkout, Gym } from '../types/workout';

export const INITIAL_GYMS: Gym[] = [
  {
    id: 'gym-matrix',
    name: 'Зал Technogym',
    brand: 'technogym',
    notes: 'Тренажёры Technogym.',
    isDefault: true,
  },
  {
    id: 'gym-technogym',
    name: 'Зал Matrix',
    brand: 'matrix',
    notes: 'Стандартные блоки.',
  },
];

/**
 * Upper / Lower — персонально под Сергея (1.5 года, InBody ~95 кг / 27% жира,
 * жим ногами «убивает» остаток сессии, часто 3–4 подхода в отказ).
 *
 * Исследования (объём приравнен):
 * - Ramos-Campo 2024 (JSCR): split ≈ full-body по силе и гипертрофии.
 * - Schoenfeld 2019 (J Sports Sci): частота 1–3×/нед на мышцу не даёт преимущества
 *   при равном недельном объёме — важнее набрать подходы качественно.
 * - Baz-Valle / обзор 2022: ориентир ~12–20 тяжёлых подходов на группу в неделю.
 * - Grgic 2021 / Refalo 2023: отказ в каждом подходе не обязателен; близко к отказу
 *   (0–2 повтора в запасе) достаточно, отказ на всех сетах только копит усталость.
 *
 * Поэтому: ноги отдельно (Lower), верх отдельно (Upper), 3 подхода вместо 4,
 * отказ только в последнем подходе упражнения. 2–3 раза/нед: чередуй U ↔ L.
 */
export const WORKOUT_PROGRAM: Record<'U' | 'L', ProgramWorkout> = {
  U: {
    type: 'U',
    title: 'ВЕРХ (U)',
    subTitle: 'Грудь / Спина / Плечи / Руки — без ног, свежая сила',
    supersets: [
      {
        id: 'superset-u1',
        number: 1,
        title: '1. Жим на верх груди',
        rest1Text: '2–3 мин',
        rest1Sec: 150,
        rest2Text: '2–3 мин',
        rest2Sec: 150,
        exercises: [
          {
            id: 'a-2.1',
            supersetId: 'superset-u1',
            code: '1.1',
            name: 'Жим в Смите на наклонной скамье (25–30°)',
            muscleGroup: 'Верх груди',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 92.5,
            progressionNotes:
              '3 подхода. 1–2-й: оставь 1–2 повтора в запасе. 3-й — близко к отказу. 3×10 → +2.5 кг. Один снаряд (Смит или Хаммер) на 8 недель.',
            focusNotes:
              'Можно Хаммер на верх — тот же слот. Опускание к ключицам. Не суперсеть с другими тяжёлыми.',
          },
        ],
      },
      {
        id: 'superset-u2',
        number: 2,
        title: '2. Вертикальная тяга',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-1.2',
            supersetId: 'superset-u2',
            code: '2.1',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 70,
            progressionNotes:
              'Фиксируй БЛОК 70 кг (не прыгай на гравитрон в этой ячейке). 3×10 → +5 кг. Отказ только в 3-м.',
            focusNotes: 'Грудь к грифу, локти вниз. Гравитрон — запасной вариант, если блока нет.',
          },
        ],
      },
      {
        id: 'superset-u3',
        number: 3,
        title: '3. Горизонтальная тяга',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-2.2',
            supersetId: 'superset-u3',
            code: '3.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 40,
            progressionNotes:
              'Было 38×16×4 — слишком легко и длинно. 3×6–10 @ 40. 3×10 → 42.5. Без памп-20.',
            focusNotes: 'Локоть к поясу, пауза 1 сек. Контроль негатива.',
          },
        ],
      },
      {
        id: 'superset-u4',
        number: 4,
        title: '4. Трицепс / грудь',
        rest1Text: '90–120 сек',
        rest1Sec: 105,
        rest2Text: '90–120 сек',
        rest2Sec: 105,
        exercises: [
          {
            id: 'a-3.1',
            supersetId: 'superset-u4',
            code: '4.1',
            name: 'Отжимания на брусьях',
            muscleGroup: 'Грудь / трицепс',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 2.5,
            progressionNotes:
              'Гравитрон: разгрузка 2.5 кг. 3×12 → −2 кг разгрузки. Отказ только в последнем.',
            focusNotes: 'Наклон вперёд под грудь. В поле веса — РАЗГРУЗКА.',
          },
        ],
      },
      {
        id: 'superset-u5',
        number: 5,
        title: '5. Плечи + бицепс (лёгкая пара)',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'a-3.2',
            supersetId: 'superset-u5',
            code: '5.1',
            name: 'Махи гантелями в стороны (или в кроссовере)',
            muscleGroup: 'Средняя дельта',
            targetSets: 2,
            targetReps: '10–15',
            targetWeightKg: 14,
            progressionNotes:
              'Всего 2 рабочих (не 4×20). 2×15 → +1–2 кг. Можно чередовать с махами в кроссовере 20 кг.',
            focusNotes: 'Строгая форма, без трапеций. Единственная «пара» дня — с бицепсом.',
          },
          {
            id: 'b-3.2',
            supersetId: 'superset-u5',
            code: '5.2',
            name: 'Сгибания рук с гантелями на наклонной скамье (45–60°)',
            muscleGroup: 'Бицепс',
            targetSets: 2,
            targetReps: '8–12',
            targetWeightKg: 37.5,
            progressionNotes: '2×12 @ 37.5 → +2.5. Рычаг/гантели — один вариант на цикл.',
            focusNotes: 'Можно рычажный бицепс. Медленный негатив. Суперсет с махами ок.',
          },
        ],
      },
    ],
  },

  L: {
    type: 'L',
    title: 'НИЗ (L)',
    subTitle: 'Ноги свежие — жим ногами не убивает верх',
    supersets: [
      {
        id: 'superset-l1',
        number: 1,
        title: '1. Жим ногами (главное)',
        rest1Text: '2.5–3 мин',
        rest1Sec: 165,
        rest2Text: '2.5–3 мин',
        rest2Sec: 165,
        exercises: [
          {
            id: 'a-1.1',
            supersetId: 'superset-l1',
            code: '1.1',
            name: 'Жим ногами платформой (глубокий)',
            muscleGroup: 'Квадрицепс',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 205,
            progressionNotes:
              'Только 3 подхода (не 4). 1–2-й с запасом 1–2 повтора, 3-й почти в отказ. 3×10 → +5 кг. После него ещё 2 упражнения — силы хватит.',
            focusNotes:
              'Стопы низко, глубокий опуск. Это единственный «тяжёлый» акцент дня. Не делай 15–20 повт.',
          },
        ],
      },
      {
        id: 'superset-l2',
        number: 2,
        title: '2. Бицепс бедра',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'b-1.1',
            supersetId: 'superset-l2',
            code: '2.1',
            name: 'Сгибания ног сидя',
            muscleGroup: 'Бицепс бедра',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 55,
            progressionNotes:
              'Не 54×20 и не 41×30. 3×6–10 @ 55. 3×10 → +2.5/5. Сидя или лёжа — один тренажёр на цикл.',
            focusNotes: 'Полная амплитуда, негатив 2–3 сек. Бедра прижаты.',
          },
        ],
      },
      {
        id: 'superset-l3',
        number: 3,
        title: '3. Изоляция квадрицепса',
        rest1Text: '90 сек',
        rest1Sec: 90,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'l-3.1',
            supersetId: 'superset-l3',
            code: '3.1',
            name: 'Разгибания ног сидя',
            muscleGroup: 'Квадрицепс',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 55,
            progressionNotes:
              '3×12 → +2.5–5 кг. Последний подход можно до отказа — изоляция безопаснее жима.',
            focusNotes: 'Валик на голени, пик вверху 1 сек. Добивка после жима ногами.',
          },
        ],
      },
      {
        id: 'superset-l4',
        number: 4,
        title: '4. Задняя дельта (лёгкое, пока ноги отдыхают)',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '75 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'b-2.4',
            supersetId: 'superset-l4',
            code: '4.1',
            name: 'Тяга к лицу (Face Pull) в кроссовере',
            muscleGroup: 'Задняя дельта',
            targetSets: 2,
            targetReps: '10–15',
            targetWeightKg: 27.5,
            progressionNotes:
              '2×15 @ 27.5 → 30. Не 4×20. Лёгкое качество в конце, не «добивание до смерти».',
            focusNotes: 'К лицу, кисти наружу. Осанка + задняя дельта. Ноги уже сделаны — не геройствуй.',
          },
        ],
      },
    ],
  },
};

export type WorkoutProgramMap = Record<string, ProgramWorkout>;
/** Bump forces clients off stale A/B cache onto Upper/Lower. */
export const PROGRAM_SCHEMA_VERSION = 6;

export function getWorkoutProgram(): WorkoutProgramMap {
  try {
    if (localStorage.getItem('fit_tracker_program_schema_v6') !== '1') {
      localStorage.setItem('fit_tracker_program_schema_v6', '1');
      localStorage.removeItem('fit_tracker_program_v1');
      localStorage.removeItem('fit_tracker_program_schema_v3');
      localStorage.removeItem('fit_tracker_program_schema_v4');
      localStorage.removeItem('fit_tracker_program_schema_v5');
      return WORKOUT_PROGRAM;
    }
    const saved = JSON.parse(localStorage.getItem('fit_tracker_program_v1') || '{}') as WorkoutProgramMap;
    return Object.keys(saved).length ? saved : WORKOUT_PROGRAM;
  } catch {
    return WORKOUT_PROGRAM;
  }
}

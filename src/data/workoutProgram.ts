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
 * A / B / C — три разных дня (не U/L-карусель).
 *
 * Недельный объём при A+B+C (исследования: ~10–20 тяжёлых подходов/группа/нед
 * у тренированных — Baz-Valle 2022; частота при равном объёме ≈ безразлична —
 * Schoenfeld 2019; split ≈ full-body — Ramos-Campo 2024):
 *
 *   Квадрицепс     4+0+4 = 12
 *   Бицепс бедра   0+4+3 = 7   (низ нормы; задняя цепь добивается косвенно)
 *   Грудь          4+3+3 = 10
 *   Спина          3+4+3 = 10
 *   Средняя дельта 3+0+2 = 5   (+ жимы)
 *   Задняя дельта  0+3+2 = 5
 *   Бицепс         0+3+0 = 3   (+ тяги)
 *   Трицепс        0+0+2 = 2   (+ жимы/брусья)
 *
 * Порядок: сначала верх (пока свежий), ноги — ближе к концу, но не 6-м
 * упражнением после убийственного жима. Макс 4 слота/день.
 * Отказ только в последнем подходе упражнения.
 *
 * 2 дня/нед: просто крути A→B→C→A… (за 2 недели все мышцы получат объём).
 */
export const WORKOUT_PROGRAM: Record<'A' | 'B' | 'C', ProgramWorkout> = {
  A: {
    type: 'A',
    title: 'ДЕНЬ A',
    subTitle: 'Горизонталь + квадрицепс · ~12 подходов',
    supersets: [
      {
        id: 'superset-a1',
        number: 1,
        title: '1. Жим на верх (пока свежий)',
        rest1Text: '2–3 мин',
        rest1Sec: 150,
        rest2Text: '2–3 мин',
        rest2Sec: 150,
        exercises: [
          {
            id: 'a-2.1',
            supersetId: 'superset-a1',
            code: '1.1',
            name: 'Жим в Смите на наклонной скамье (25–30°)',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 90,
            progressionNotes:
              '4×6–10 @ 90. Сеты 1–3 с запасом 1–2 повтора, 4-й почти в отказ. 4×10 → +2.5. Смит или Хаммер — один на цикл.',
            focusNotes: 'Первым — пока нет усталости от ног. Опускание к ключицам.',
          },
        ],
      },
      {
        id: 'superset-a2',
        number: 2,
        title: '2. Горизонтальная тяга',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-2.2',
            supersetId: 'superset-a2',
            code: '2.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 40,
            progressionNotes: '3×10 @ 40 → 42.5. Не 16–20 повт.',
            focusNotes: 'Локоть к поясу, пауза вверху.',
          },
        ],
      },
      {
        id: 'superset-a3',
        number: 3,
        title: '3. Жим ногами (главные ноги недели)',
        rest1Text: '2.5–3 мин',
        rest1Sec: 165,
        rest2Text: '2.5–3 мин',
        rest2Sec: 165,
        exercises: [
          {
            id: 'a-1.1',
            supersetId: 'superset-a3',
            code: '3.1',
            name: 'Жим ногами платформой (глубокий)',
            muscleGroup: 'Квадрицепс',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 205,
            progressionNotes:
              '4×6–10 @ 205. После него только махи — не 3 тяжёлых упражнения. 4×10 → +5 кг.',
            focusNotes: 'Стопы низко, глубина. Тяжёлая работа ног — здесь, не каждый день.',
          },
        ],
      },
      {
        id: 'superset-a4',
        number: 4,
        title: '4. Средняя дельта',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '75 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'a-3.2',
            supersetId: 'superset-a4',
            code: '4.1',
            name: 'Махи гантелями в стороны (или в кроссовере)',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 14,
            progressionNotes: '3×15 @ 14 → +1–2 кг. Лёгкое после жима ногами — ок.',
            focusNotes: 'Строгая форма. Единственное после ног.',
          },
        ],
      },
    ],
  },

  B: {
    type: 'B',
    title: 'ДЕНЬ B',
    subTitle: 'Вертикаль + бицепс бедра · без жима ногами',
    supersets: [
      {
        id: 'superset-b1',
        number: 1,
        title: '1. Вертикальная тяга',
        rest1Text: '2–3 мин',
        rest1Sec: 150,
        rest2Text: '2–3 мин',
        rest2Sec: 150,
        exercises: [
          {
            id: 'a-1.2',
            supersetId: 'superset-b1',
            code: '1.1',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 70,
            progressionNotes:
              'Блок 70×6–10 (не гравитрон в этой ячейке). 4×10 → +5. Отказ только в 4-м.',
            focusNotes: 'Грудь к грифу. Гравитрон — только если блока нет.',
          },
        ],
      },
      {
        id: 'superset-b2',
        number: 2,
        title: '2. Жим на верх',
        rest1Text: '2–3 мин',
        rest1Sec: 150,
        rest2Text: '2–3 мин',
        rest2Sec: 150,
        exercises: [
          {
            id: 'b-2.3',
            supersetId: 'superset-b2',
            code: '2.1',
            name: 'Жим в Хаммере на верх груди',
            muscleGroup: 'Верх груди',
            targetSets: 3,
            targetReps: '6–10',
            targetWeightKg: 90,
            progressionNotes: '3×10 @ 90 → +2.5. Можно Смит — не путай с днём A в одной прогрессии.',
            focusNotes: 'Второй жимовой стимул недели. Лопатки вжаты.',
          },
        ],
      },
      {
        id: 'superset-b3',
        number: 3,
        title: '3. Бицепс бедра',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'b-1.1',
            supersetId: 'superset-b3',
            code: '3.1',
            name: 'Сгибания ног сидя',
            muscleGroup: 'Бицепс бедра',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 55,
            progressionNotes:
              '4×6–10 @ 55 (не 20–30 повт). 4×10 → +2.5/5. Сидя или лёжа — один на цикл.',
            focusNotes: 'Нет жима ногами — задняя цепь получает приоритет и качество.',
          },
        ],
      },
      {
        id: 'superset-b4',
        number: 4,
        title: '4. Задняя дельта + бицепс',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'b-2.4',
            supersetId: 'superset-b4',
            code: '4.1',
            name: 'Тяга к лицу (Face Pull) в кроссовере',
            muscleGroup: 'Задняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 27.5,
            progressionNotes: '3×15 @ 27.5 → 30.',
            focusNotes: 'Суперсет с бицепсом — единственная пара дня.',
          },
          {
            id: 'b-3.2',
            supersetId: 'superset-b4',
            code: '4.2',
            name: 'Сгибания рук с гантелями на наклонной скамье (45–60°)',
            muscleGroup: 'Бицепс',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 37.5,
            progressionNotes: '3×12 @ 37.5 → +2.5. Рычаг ок.',
            focusNotes: 'Медленный негатив.',
          },
        ],
      },
    ],
  },

  C: {
    type: 'C',
    title: 'ДЕНЬ C',
    subTitle: 'Добор объёма · брусья + разгибания + тяга',
    supersets: [
      {
        id: 'superset-c1',
        number: 1,
        title: '1. Брусья / грудь-трицепс',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-3.1',
            supersetId: 'superset-c1',
            code: '1.1',
            name: 'Отжимания на брусьях',
            muscleGroup: 'Грудь / трицепс',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 2.5,
            progressionNotes: 'Разгрузка 2.5. 3×12 → −2 кг разгрузки.',
            focusNotes: 'Наклон вперёд. В поле — разгрузка.',
          },
        ],
      },
      {
        id: 'superset-c2',
        number: 2,
        title: '2. Тяга (второй горизонтальный стимул)',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'c-2.1',
            supersetId: 'superset-c2',
            code: '2.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 38,
            progressionNotes:
              'Чуть легче дня A (38×8–12). Отдельный id — не путать прогрессию с A. 3×12 → +2.',
            focusNotes: 'Можно рычажную/блочную горизонтальную тягу того же слота.',
          },
        ],
      },
      {
        id: 'superset-c3',
        number: 3,
        title: '3. Ноги: разгибания + сгибания',
        rest1Text: '90 сек',
        rest1Sec: 90,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'l-3.1',
            supersetId: 'superset-c3',
            code: '3.1',
            name: 'Разгибания ног сидя',
            muscleGroup: 'Квадрицепс',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 55,
            progressionNotes:
              '4×12 @ 55 → +2.5/5. Добираем квадрицепс без тяжёлого жима ногами.',
            focusNotes: 'Суперсет со сгибаниями — ноги в паре, верх уже сделан.',
          },
          {
            id: 'c-3.2',
            supersetId: 'superset-c3',
            code: '3.2',
            name: 'Сгибания ног сидя',
            muscleGroup: 'Бицепс бедра',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 50,
            progressionNotes: '3×12 @ 50 → +2.5. Легче, чем день B (там силовые 6–10).',
            focusNotes: 'Можно лёжа. Второй стимул бицепса бедра за неделю.',
          },
        ],
      },
      {
        id: 'superset-c4',
        number: 4,
        title: '4. Плечи + трицепс',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '75 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'b-3.3',
            supersetId: 'superset-c4',
            code: '4.1',
            name: 'Махи в кроссовере в сторону',
            muscleGroup: 'Средняя дельта',
            targetSets: 2,
            targetReps: '10–15',
            targetWeightKg: 20,
            progressionNotes: '2×15 @ 20 → +2.5. Не подставляй жим вверх вместо махов.',
            focusNotes: 'Пара с face pull или трицепсом.',
          },
          {
            id: 'c-4.2',
            supersetId: 'superset-c4',
            code: '4.2',
            name: 'Тяга к лицу (Face Pull) в кроссовере',
            muscleGroup: 'Задняя дельта',
            targetSets: 2,
            targetReps: '10–15',
            targetWeightKg: 25,
            progressionNotes: '2×15 @ 25. Второй face pull недели (день B был тяжелее).',
            focusNotes: 'Закрываем заднюю дельту до 5 подходов/нед.',
          },
        ],
      },
    ],
  },
};

export type WorkoutProgramMap = Record<string, ProgramWorkout>;
/** Bump: Upper/Lower → A/B/C volume-balanced. */
export const PROGRAM_SCHEMA_VERSION = 7;

export function getWorkoutProgram(): WorkoutProgramMap {
  try {
    if (localStorage.getItem('fit_tracker_program_schema_v7') !== '1') {
      localStorage.setItem('fit_tracker_program_schema_v7', '1');
      localStorage.removeItem('fit_tracker_program_v1');
      localStorage.removeItem('fit_tracker_program_schema_v3');
      localStorage.removeItem('fit_tracker_program_schema_v4');
      localStorage.removeItem('fit_tracker_program_schema_v5');
      localStorage.removeItem('fit_tracker_program_schema_v6');
      return WORKOUT_PROGRAM;
    }
    const saved = JSON.parse(localStorage.getItem('fit_tracker_program_v1') || '{}') as WorkoutProgramMap;
    return Object.keys(saved).length ? saved : WORKOUT_PROGRAM;
  } catch {
    return WORKOUT_PROGRAM;
  }
}

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
 * A / B / C — объём поднят до рабочей нормы гипертрофии (~10–14+ тяжёлых
 * подходов на крупные группы / ~8–10 на мелкие при A+B+C).
 *
 *   Квадрицепс     4+0+4 = 12
 *   Бицепс бедра   0+5+5 = 10
 *   Грудь          4+4+4 = 12
 *   Спина          4+4+4 = 12
 *   Средняя дельта 3+3жим+3 = 9
 *   Задняя дельта  0+4+4 = 8
 *   Бицепс         0+4+0 = 4 (+тяги)
 *   Трицепс        2 канат + 4 брусья (+жимы)
 *
 * Добавки в дни B и C (без жима ногами). День A: +1 к тяге до ног;
 * после жима ногами по-прежнему только махи.
 */
export const WORKOUT_PROGRAM: Record<'A' | 'B' | 'C', ProgramWorkout> = {
  A: {
    type: 'A',
    title: 'ДЕНЬ A',
    subTitle: 'Жим ногами → Хаммер → тяга → махи',
    supersets: [
      {
        id: 'superset-a1',
        number: 1,
        title: '1. Жим ногами',
        rest1Text: '2.5–3 мин',
        rest1Sec: 165,
        rest2Text: '2.5–3 мин',
        rest2Sec: 165,
        exercises: [
          {
            id: 'a-1.1',
            supersetId: 'superset-a1',
            code: '1.1',
            name: 'Жим ногами платформой (глубокий)',
            muscleGroup: 'Квадрицепс',
            targetSets: 4,
            targetReps: '6–10',
            focusNotes: 'Стопы низко, глубина. Вес подставляется с прошлого раза — не завышается.',
          },
        ],
      },
      {
        id: 'superset-a2',
        number: 2,
        title: '2. Жим на верх (Хаммер по умолчанию)',
        rest1Text: '2–3 мин',
        rest1Sec: 150,
        rest2Text: '2–3 мин',
        rest2Sec: 150,
        exercises: [
          {
            id: 'a-2.1',
            supersetId: 'superset-a2',
            code: '2.1',
            name: 'Жим в Хаммере на верх груди',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '6–10',
            focusNotes:
              'В этом дне первым в списке — Хаммер. Смит / штанга лёжа / наклон — варианты в меню.',
          },
        ],
      },
      {
        id: 'superset-a3',
        number: 3,
        title: '3. Горизонтальная тяга',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '2 мин',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-2.2',
            supersetId: 'superset-a3',
            code: '3.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 4,
            targetReps: '6–10',
            focusNotes: 'Локоть к поясу, пауза вверху.',
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
            name: 'Махи в кроссовере на блоке',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            focusNotes: 'Строгая форма. Не добавляй сюда тяжёлое.',
          },
        ],
      },
    ],
  },

  B: {
    type: 'B',
    title: 'ДЕНЬ B',
    subTitle: 'Вертикаль + задняя цепь · день повышенного объёма',
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
              'Блок 70×6–10. 4×10 → +5. Отказ только в последнем.',
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
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 90,
            progressionNotes:
              '4×6–10 @ 90 (было 3). 4×10 → +2.5. Не мешай прогрессию со Смитом дня A.',
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
            targetSets: 5,
            targetReps: '6–10',
            targetWeightKg: 55,
            progressionNotes:
              '5×6–10 @ 55 — добор до ~10/нед на бицепс бедра. 5×10 → +2.5/5. Сидя или лёжа — один на цикл.',
            focusNotes: 'Без жима ногами — можно дать полный объём задней цепи.',
          },
        ],
      },
      {
        id: 'superset-b4',
        number: 4,
        title: '4. Задняя дельта + бицепс (добивка рук)',
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
            targetSets: 4,
            targetReps: '10–15',
            targetWeightKg: 27.5,
            progressionNotes: '4×15 @ 27.5 → 30. Альтернатива: обратная бабочка.',
            focusNotes:
              'Суперсет с бицепсом оставляем: цель блока — добить руки и заднюю дельту. Тяги уже дали косвенный бицепс — здесь контролируемая изоляция.',
          },
          {
            id: 'b-3.2',
            supersetId: 'superset-b4',
            code: '4.2',
            name: 'Сгибания на бицепс',
            muscleGroup: 'Бицепс',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 37.5,
            progressionNotes:
              '4×12 → +2.5. Приоритет: рычаг/Скотт под блины → EZ стоя → гантели → блок в кроссовере.',
            focusNotes: 'Медленный негатив. Не гонись за весом после тяг.',
          },
        ],
      },
      {
        id: 'superset-b5',
        number: 5,
        title: '5. Жим на плечи + трицепс',
        rest1Text: '2 мин',
        rest1Sec: 120,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'b-3.3',
            supersetId: 'superset-b5',
            code: '5.1',
            name: 'Жим вверх сидя на плечи',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '6–10',
            focusNotes: 'Рычажный сидя → гантели → блок. Суперсет с трицепсом.',
          },
          {
            id: 'b-5.2',
            supersetId: 'superset-b5',
            code: '5.2',
            name: 'Разгибания на трицепс с канатом (верхний блок)',
            muscleGroup: 'Трицепс',
            targetSets: 3,
            targetReps: '10–15',
            focusNotes: 'Канат на верхнем блоке. 3 подхода.',
          },
        ],
      },
    ],
  },

  C: {
    type: 'C',
    title: 'ДЕНЬ C',
    subTitle: 'Добор до нормы · брусья + ноги-изоляция + плечи',
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
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 2.5,
            progressionNotes:
              '4×8–12, разгрузка 2.5 (было 3 подхода). 4×12 → −2 кг разгрузки.',
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
            name: 'Горизонтальная тяга блока сидя',
            muscleGroup: 'Середина спины',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 55,
            progressionNotes:
              '4×8–12. Дефолт — блок сидя (гантель уже в день A — так и нужно 2×/нед спину, но разными снарядами). 4×12 → +5.',
            focusNotes: 'Горизонтальный блок / упор в грудь. Гантель — запасной вариант в списке.',
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
            progressionNotes: '4×12 @ 55 → +2.5/5. Добор квадрицепса без жима ногами.',
            focusNotes: 'Суперсет со сгибаниями.',
          },
          {
            id: 'c-3.2',
            supersetId: 'superset-c3',
            code: '3.2',
            name: 'Сгибания ног сидя',
            muscleGroup: 'Бицепс бедра',
            targetSets: 5,
            targetReps: '8–12',
            targetWeightKg: 50,
            progressionNotes:
              '5×8–12 @ 50 (было 3) — вместе с днём B = 10 на бицепс бедра. 5×12 → +2.5.',
            focusNotes: 'Можно лёжа. Легче силовых 6–10 дня B.',
          },
        ],
      },
      {
        id: 'superset-c4',
        number: 4,
        title: '4. Плечи: средняя + задняя',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '75 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'c-4.1',
            supersetId: 'superset-c4',
            code: '4.1',
            name: 'Махи в кроссовере на блоке',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 14,
            progressionNotes:
              '3×15. Кроссовер приоритетнее гантелей. Рычажный жим сидя — в день B, здесь не дублируем.',
            focusNotes: 'Суперсет с обратной бабочкой.',
          },
          {
            id: 'c-4.2',
            supersetId: 'superset-c4',
            code: '4.2',
            name: 'Обратная бабочка / задняя дельта',
            muscleGroup: 'Задняя дельта',
            targetSets: 4,
            targetReps: '10–15',
            targetWeightKg: 35,
            progressionNotes:
              '4×10–15. Здесь первой — обратная бабочка (Face Pull уже был в B).',
            focusNotes: 'Face Pull — второй в списке, если бабочки нет.',
          },
        ],
      },
    ],
  },
};

export type WorkoutProgramMap = Record<string, ProgramWorkout>;
export const PROGRAM_SCHEMA_VERSION = 10;

export function getWorkoutProgram(): WorkoutProgramMap {
  try {
    if (localStorage.getItem('fit_tracker_program_schema_v10') !== '1') {
      localStorage.setItem('fit_tracker_program_schema_v10', '1');
      localStorage.removeItem('fit_tracker_program_v1');
      localStorage.removeItem('fit_tracker_program_schema_v3');
      localStorage.removeItem('fit_tracker_program_schema_v4');
      localStorage.removeItem('fit_tracker_program_schema_v5');
      localStorage.removeItem('fit_tracker_program_schema_v6');
      localStorage.removeItem('fit_tracker_program_schema_v7');
      localStorage.removeItem('fit_tracker_program_schema_v8');
      localStorage.removeItem('fit_tracker_program_schema_v9');
      return WORKOUT_PROGRAM;
    }
    const saved = JSON.parse(localStorage.getItem('fit_tracker_program_v1') || '{}') as WorkoutProgramMap;
    return Object.keys(saved).length ? saved : WORKOUT_PROGRAM;
  } catch {
    return WORKOUT_PROGRAM;
  }
}

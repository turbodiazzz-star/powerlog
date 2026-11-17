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
 * Progression (double progression):
 * 1) Hit TOP of rep range on ALL working sets with clean form.
 * 2) Next session: +2.5 kg plates / +1 plate stack / −2 kg assist on gravitron.
 * 3) If you fail top reps — stay on weight until you get them.
 * No fixed 11-11-11-11 forever. Last set should usually be hardest.
 *
 * Weights below = start from YOUR latest logs (Nov 2026), nudged for overload.
 * Soft recomp phase: heavy compounds, fewer pump sets.
 */
export const WORKOUT_PROGRAM: Record<'A' | 'B', ProgramWorkout> = {
  A: {
    type: 'A',
    title: 'ТРЕНИРОВКА A',
    subTitle: 'Ноги / Грудь / Спина / Плечи — силовая прогрессия',
    supersets: [
      {
        id: 'superset-a1',
        number: 1,
        title: 'БЛОК 1: Квадрицепс + Грудь/трицепс',
        rest1Text: '90–120 сек',
        rest1Sec: 105,
        rest2Text: '120–150 сек',
        rest2Sec: 135,
        exercises: [
          {
            id: 'a-1.1',
            supersetId: 'superset-a1',
            code: '1.1',
            name: 'Жим ногами платформой (глубокий)',
            muscleGroup: 'Квадрицепс',
            targetSets: 4,
            targetReps: '8–10',
            targetWeightKg: 205,
            progressionNotes: 'Старт 205 кг (было 200×11). Цель: 4×10 → следующий раз +5 кг блинов.',
            focusNotes:
              'Стопы низко, глубокий опуск. 4 рабочих подхода. Не делай 15–20 повт — это убивает прогрессию. Последний подход тяжелее первых.',
          },
          {
            id: 'a-3.1',
            supersetId: 'superset-a1',
            code: '1.2',
            name: 'Отжимания на брусьях',
            muscleGroup: 'Грудь / трицепс',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 2.5,
            progressionNotes:
              'Гравитрон: разгрузка 2.5 кг (было 4.5). Сделал 4×12 → режь разгрузку на 2 кг. Цель: свои брусья.',
            focusNotes:
              'Наклон вперёд под грудь. В гравитроне в поле — РАЗГРУЗКА. Рабочий = вес тела − разгрузка.',
          },
        ],
      },
      {
        id: 'superset-a2',
        number: 2,
        title: 'БЛОК 2: Верх груди + Широчайшие',
        rest1Text: '90–120 сек',
        rest1Sec: 105,
        rest2Text: '120 сек',
        rest2Sec: 120,
        exercises: [
          {
            id: 'a-2.1',
            supersetId: 'superset-a2',
            code: '2.1',
            name: 'Жим в Смите на наклонной скамье (25–30°)',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 92.5,
            progressionNotes:
              'Старт 92.5 (было ~90×10 Хаммер/Смит). 4×10 чисто → +2.5 кг. Не прыгай на 15 повт.',
            focusNotes:
              'Смит или Хаммер на верх — один и тот же слот. Опускание к ключицам, лопатки вжаты. Подходы с падением повторов ок: 10/9/8/7.',
          },
          {
            id: 'a-1.2',
            supersetId: 'superset-a2',
            code: '2.2',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 7,
            progressionNotes:
              'Гравитрон: разгрузка 7 кг (было 9×13). 4×10 → −2 кг разгрузки. Или блок 70 кг × 6–10, если не гравитрон.',
            focusNotes:
              'Гравитрон = разгрузка. Блок/Pulldown = вес на стеке. Не мешай варианты в одной прогрессии — выбери один на 4 недели.',
          },
        ],
      },
      {
        id: 'superset-a3',
        number: 3,
        title: 'БЛОК 3: Середина спины + Средняя дельта',
        rest1Text: '75–90 сек',
        rest1Sec: 90,
        rest2Text: '75–90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'a-2.2',
            supersetId: 'superset-a3',
            code: '3.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 40,
            progressionNotes:
              'Старт 40 кг (было 38×16 — слишком легко). Цель 4×12 → 42 кг. Убери памп 16–20.',
            focusNotes:
              'Локоть 45–60°, к поясу, пауза 1 сек вверху. Контроль негатива 2–3 сек.',
          },
          {
            id: 'a-3.2',
            supersetId: 'superset-a3',
            code: '3.2',
            name: 'Махи гантелями в стороны (или в кроссовере)',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 14,
            progressionNotes: '3×15 @ 14 кг → 15 кг. Не делай 4×20 — жги только до 15.',
            focusNotes: 'Локти чуть выше кистей, без трапеций. Строгая форма важнее веса.',
          },
        ],
      },
    ],
  },
  B: {
    type: 'B',
    title: 'ТРЕНИРОВКА B',
    subTitle: 'Задняя цепь / Грудь / Плечи / Бицепс — силовая прогрессия',
    supersets: [
      {
        id: 'superset-b1',
        number: 1,
        title: 'БЛОК 1: Бицепс бедра + Широчайшие',
        rest1Text: '90 сек',
        rest1Sec: 90,
        rest2Text: '120 сек',
        rest2Sec: 120,
        exercises: [
          {
            id: 'b-1.1',
            supersetId: 'superset-b1',
            code: '1.1',
            name: 'Сгибания ног сидя',
            muscleGroup: 'Бицепс бедра',
            targetSets: 4,
            targetReps: '8–12',
            targetWeightKg: 55,
            progressionNotes:
              'Старт 55 кг (у тебя часто 45–54×15–20). 4×12 → +2.5/5 кг. Негатив 3 сек.',
            focusNotes: 'Бедра прижаты валиком. Полная амплитуда. Один тренажёр на цикл (сидя или лёжа).',
          },
          {
            id: 'b-1.2',
            supersetId: 'superset-b1',
            code: '1.2',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 70,
            progressionNotes:
              'Старт блок 70 кг × 6–10 (не 65×13 и не путай с гравитроном). 4×10 → +5 кг.',
            focusNotes:
              'На B фиксируй BLOCK/Pulldown, не гравитрон — иначе прогрессия ломается. Грудь к грифу, локти вниз.',
          },
        ],
      },
      {
        id: 'superset-b2',
        number: 2,
        title: 'БЛОК 2: Верх груди + Задняя дельта',
        rest1Text: '90–120 сек',
        rest1Sec: 105,
        rest2Text: '90 сек',
        rest2Sec: 90,
        exercises: [
          {
            id: 'b-2.3',
            supersetId: 'superset-b2',
            code: '2.1',
            name: 'Жим в Хаммере на верх груди',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '6–10',
            targetWeightKg: 92.5,
            progressionNotes:
              'Старт 92.5 (было 90×10). 4×10 → +2.5. Смит/Хаммер — выбери один на 4 недели.',
            focusNotes: 'Сиденье: рукояти у верхней груди. Лопатки вжаты. Допустимо 10/8/7/6.',
          },
          {
            id: 'b-2.4',
            supersetId: 'superset-b2',
            code: '2.2',
            name: 'Тяга к лицу (Face Pull) в кроссовере',
            muscleGroup: 'Задняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 27.5,
            progressionNotes: 'Старт 27.5 (было 25×20). 3×15 → 30 кг. Убери 4×20.',
            focusNotes: 'К лицу, кисти наружу, без рывка. Задняя дельта + осанка.',
          },
        ],
      },
      {
        id: 'superset-b3',
        number: 3,
        title: 'БЛОК 3: Бицепс + Средняя дельта',
        rest1Text: '75 сек',
        rest1Sec: 75,
        rest2Text: '75 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'b-3.2',
            supersetId: 'superset-b3',
            code: '3.1',
            name: 'Сгибания рук с гантелями на наклонной скамье (45–60°)',
            muscleGroup: 'Бицепс',
            targetSets: 3,
            targetReps: '8–12',
            targetWeightKg: 37.5,
            progressionNotes:
              'Рычаг/гантели 37.5 (было 35). 3×12 → +2.5. Не раздувай до 16 повт.',
            focusNotes: 'Локти чуть сзади корпуса. Медленный негатив. Можно рычажный бицепс-тренажёр.',
          },
          {
            id: 'b-3.3',
            supersetId: 'superset-b3',
            code: '3.2',
            name: 'Махи в кроссовере в сторону',
            muscleGroup: 'Средняя дельта',
            targetSets: 3,
            targetReps: '10–15',
            targetWeightKg: 20,
            progressionNotes:
              'Старт 20 кг махи (не жим вверх 80 — это другое движение). 3×15 → +2.5.',
            focusNotes: 'Только махи в сторону. Жим на плечи — не подставляй сюда, ломает прогрессию.',
          },
        ],
      },
    ],
  },
};

export type WorkoutProgramMap = Record<string, ProgramWorkout>;
/** Bump forces clients off stale custom program cache. */
export const PROGRAM_SCHEMA_VERSION = 5;

export function getWorkoutProgram(): WorkoutProgramMap {
  try {
    if (localStorage.getItem('fit_tracker_program_schema_v5') !== '1') {
      localStorage.setItem('fit_tracker_program_schema_v5', '1');
      localStorage.removeItem('fit_tracker_program_v1');
      localStorage.removeItem('fit_tracker_program_schema_v3');
      localStorage.removeItem('fit_tracker_program_schema_v4');
      return WORKOUT_PROGRAM;
    }
    const saved = JSON.parse(localStorage.getItem('fit_tracker_program_v1') || '{}') as WorkoutProgramMap;
    return Object.keys(saved).length ? saved : WORKOUT_PROGRAM;
  } catch {
    return WORKOUT_PROGRAM;
  }
}

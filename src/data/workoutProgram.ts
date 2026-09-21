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

export const WORKOUT_PROGRAM: Record<'A' | 'B', ProgramWorkout> = {
  A: {
    type: 'A',
    title: 'ТРЕНИРОВКА A',
    subTitle: 'Квадрицепс / Грудь и трицепс / Верх груди / Спина / Плечи',
    supersets: [
      {
        id: 'superset-a1',
        number: 1,
        title: 'СУПЕРСЕТ 1: Квадрицепс + Грудь / трицепс',
        rest1Text: '60–90 сек',
        rest1Sec: 75,
        rest2Text: '90–120 сек',
        rest2Sec: 105,
        exercises: [
          {
            id: 'a-1.1',
            supersetId: 'superset-a1',
            code: '1.1',
            name: 'Жим ногами платформой (глубокий)',
            muscleGroup: 'Квадрицепс',
            targetSets: 4,
            targetReps: '8–12',
            focusNotes: 'Стопы ставим низко на платформе (на ширине плеч). Опускаем платформу максимально глубоко (до угла 90° и глубже в коленях), чтобы квадрицепс натянулся как тетива. Внизу пауза 1 секунда, мощный подъем без блокировки коленей.',
          },
          {
            id: 'a-3.1',
            supersetId: 'superset-a1',
            code: '1.2',
            name: 'Отжимания на брусьях',
            muscleGroup: 'Грудь / трицепс',
            targetSets: 4,
            targetReps: '8–12',
            focusNotes: 'Наклон корпуса вперёд для акцента на груди; двигайся в комфортной амплитуде без боли в плечах.',
          },
        ],
      },
      {
        id: 'superset-a2',
        number: 2,
        title: 'СУПЕРСЕТ 2: Верх груди + Широчайшие',
        rest1Text: '60–90 сек',
        rest1Sec: 75,
        rest2Text: '90–120 сек',
        rest2Sec: 105,
        exercises: [
          {
            id: 'a-2.1',
            supersetId: 'superset-a2',
            code: '2.1',
            name: 'Жим в Смите на наклонной скамье (25–30°)',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '8–10',
            focusNotes: 'Опускаем штангу точно на ключичную зону груди. Угол 30° направляет механическое напряжение именно в верхний пучок.',
          },
          {
            id: 'a-1.2',
            supersetId: 'superset-a2',
            code: '2.2',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 4,
            targetReps: '8–11',
            focusNotes: 'Растяни широчайшие вверху и тяни локти вниз к корпусу без раскачки.',
          },
        ],
      },
      {
        id: 'superset-a3',
        number: 3,
        title: 'СУПЕРСЕТ 3: Середина спины + Средняя дельта',
        rest1Text: '60 сек',
        rest1Sec: 60,
        rest2Text: '60–90 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'a-2.2',
            supersetId: 'superset-a3',
            code: '3.1',
            name: 'Тяга гантели к поясу в наклоне с упором',
            muscleGroup: 'Середина спины',
            targetSets: 4,
            targetReps: '8–11',
            focusNotes: 'Ведем гантель не в карман, а под углом к поясу, отводя локоть в сторону под ~45–60° и в верхней точке максимально сжимая лопатки вместе.',
          },
          {
            id: 'a-3.2',
            supersetId: 'superset-a3',
            code: '3.2',
            name: 'Махи гантелями в стороны (или в кроссовере)',
            muscleGroup: 'Средняя дельта',
            targetSets: 4,
            targetReps: '12–15',
            focusNotes: 'Локти чуть выше запястий, подъем строго за счет средней дельты для визуального расширения плеч.',
          },
        ],
      },
    ],
  },
  B: {
    type: 'B',
    title: 'ТРЕНИРОВКА B',
    subTitle: 'Бицепс бедра / Широчайшие / Верх груди / Задняя дельта / Бицепс / Средняя дельта',
    supersets: [
      {
        id: 'superset-b1',
        number: 1,
        title: 'СУПЕРСЕТ 1: Бицепс бедра + V-форма спины',
        rest1Text: '60–90 сек',
        rest1Sec: 75,
        rest2Text: '90–120 сек',
        rest2Sec: 105,
        exercises: [
          {
            id: 'b-1.1', supersetId: 'superset-b1', code: '1.1', name: 'Сгибания ног сидя', muscleGroup: 'Бицепс бедра', targetSets: 4, targetReps: '8–12', focusNotes: 'Прижми бёдра валиком, сгибай ноги плавно и медленно опускай вес.'
          },
          {
            id: 'b-1.2',
            supersetId: 'superset-b1',
            code: '1.2',
            name: 'Вертикальная тяга верхнего блока к груди',
            muscleGroup: 'Широчайшие',
            targetSets: 4,
            targetReps: '8–11',
            focusNotes: 'Полное растяжение широчайших вверху, тяга грудью навстречу грифу, локти направлены строго вниз.',
          },
        ],
      },
      {
        id: 'superset-b2',
        number: 2,
        title: 'СУПЕРСЕТ 2: Верх груди + Задняя дельта',
        rest1Text: '60–90 сек',
        rest1Sec: 75,
        rest2Text: '90–120 сек',
        rest2Sec: 105,
        exercises: [
          {
            id: 'b-2.3',
            supersetId: 'superset-b2',
            code: '2.1',
            name: 'Жим в Хаммере на верх груди',
            muscleGroup: 'Верх груди',
            targetSets: 4,
            targetReps: '8–12',
            focusNotes: 'Настрой сиденье так, чтобы рукояти начинали движение на уровне верхней части груди.',
          },
          {
            id: 'b-2.4',
            supersetId: 'superset-b2',
            code: '2.2',
            name: 'Тяга к лицу (Face Pull) в кроссовере',
            muscleGroup: 'Задняя дельта',
            targetSets: 4,
            targetReps: '12–15',
            focusNotes: 'Тяни канат к уровню лица, разводя кисти наружу; работай подконтрольно.',
          },
        ],
      },
      {
        id: 'superset-b3',
        number: 3,
        title: 'СУПЕРСЕТ 3: Бицепс + Средняя дельта',
        rest1Text: '60 сек',
        rest1Sec: 60,
        rest2Text: '60–90 сек',
        rest2Sec: 75,
        exercises: [
          {
            id: 'b-3.2',
            supersetId: 'superset-b3',
            code: '3.1',
            name: 'Сгибания рук с гантелями на наклонной скамье (45–60°)',
            muscleGroup: 'Бицепс',
            targetSets: 4,
            targetReps: '8–12',
            focusNotes: 'Локти остаются чуть позади корпуса; опускай гантели медленно.',
          },
          {
            id: 'b-3.3',
            supersetId: 'superset-b3',
            code: '3.2',
            name: 'Махи в кроссовере в сторону',
            muscleGroup: 'Средняя дельта',
            targetSets: 4,
            targetReps: '12–15',
            focusNotes: 'Веди локоть в сторону до уровня плеча без раскачки и подъёма трапецией.',
          },
        ],
      },
    ],
  },
};

export type WorkoutProgramMap = Record<string, ProgramWorkout>;

export function getWorkoutProgram(): WorkoutProgramMap {
  try {
    if (localStorage.getItem('fit_tracker_program_schema_v2') !== '1') return WORKOUT_PROGRAM;
    const saved = JSON.parse(localStorage.getItem('fit_tracker_program_v1') || '{}') as WorkoutProgramMap;
    return Object.keys(saved).length ? saved : WORKOUT_PROGRAM;
  } catch {
    return WORKOUT_PROGRAM;
  }
}

export interface MachineOption {
  id: string;
  name: string;
  muscleGroup: string;
  exerciseId: string;
  brand: 'matrix' | 'technogym' | 'free_weight' | 'both';
  isBodyweight?: boolean;
}

export const MACHINE_OPTIONS: MachineOption[] = [
  // 1. Квадрицепс
  {
    id: 'leg_press_matrix',
    name: 'Жим ногами платформой (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
  },
  {
    id: 'leg_press_technogym',
    name: 'Жим ногами платформой (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
  },

  // 2. Широчайшие (A)
  {
    id: 'pullover_cable_matrix',
    name: 'Пуловер на верхнем блоке (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
  },
  {
    id: 'pullover_cable_technogym',
    name: 'Пуловер на верхнем блоке (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
  },
  {
    id: 'gravitron_pullups_matrix',
    name: 'Подтягивания в гравитроне (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
  },
  {
    id: 'gravitron_pullups_technogym',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
  },
  {
    id: 'hammer_lat_pull_matrix',
    name: 'Тяга в Хаммере / рычажном (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
  },
  {
    id: 'hammer_lat_pull_technogym',
    name: 'Тяга в Хаммере / рычажном (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
  },
  {
    id: 'pullups_bodyweight',
    name: 'Подтягивания (Свободный вес / только повторы)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'free_weight',
    isBodyweight: true,
  },

  // 3. Верх груди (A)
  {
    id: 'smith_upper_chest_matrix',
    name: 'Жим в Смите на наклонной скамье (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
  },
  {
    id: 'smith_upper_chest_technogym',
    name: 'Жим в Смите на наклонной скамье (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
  },
  {
    id: 'hammer_upper_chest_matrix',
    name: 'Жим в Хаммере на верх груди (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
  },
  {
    id: 'hammer_upper_chest_technogym',
    name: 'Жим в Хаммере на верх груди (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
  },
  {
    id: 'dips_free_weight_upper',
    name: 'Брусья (Свободный вес)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBodyweight: true,
  },
  {
    id: 'dips_gravitron_matrix_upper',
    name: 'Брусья в гравитроне (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
  },
  {
    id: 'dips_gravitron_technogym_upper',
    name: 'Брусья в гравитроне (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
  },

  // 4. Середина спины (A)
  {
    id: 'dumbbell_row_incline',
    name: 'Тяга гантелей к поясу в наклоне',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'free_weight',
  },
  {
    id: 'seated_cable_row_matrix',
    name: 'Тяга горизонтального блока сидя (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'matrix',
  },
  {
    id: 'seated_cable_row_technogym',
    name: 'Тяга горизонтального блока сидя (Technogym)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'technogym',
  },
  {
    id: 'barbell_bent_row',
    name: 'Тяга штанги к поясу',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'free_weight',
  },

  // 5. Низ груди / Трицепс (A)
  {
    id: 'dips_lower_chest_bodyweight',
    name: 'Отжимания на брусьях (Свободный вес)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'free_weight',
    isBodyweight: true,
  },
  {
    id: 'dips_gravitron_lower_matrix',
    name: 'Отжимания в гравитроне (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
  },
  {
    id: 'dips_gravitron_lower_technogym',
    name: 'Отжимания в гравитроне (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
  },
  {
    id: 'hammer_lower_chest_matrix',
    name: 'Жим в Хаммере на низ груди (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
  },
  {
    id: 'hammer_lower_chest_technogym',
    name: 'Жим в Хаммере на низ груди (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
  },

  // 6. Средняя дельта (A)
  {
    id: 'dumbbell_lateral_raises',
    name: 'Махи гантелями в стороны',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'free_weight',
  },
  {
    id: 'crossover_lateral_raises_matrix',
    name: 'Протяжка / махи в кроссовере (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'matrix',
  },
  {
    id: 'crossover_lateral_raises_technogym',
    name: 'Протяжка / махи в кроссовере (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'technogym',
  },

  // 7. Бицепс бедра (B)
  {
    id: 'leg_curl_seated_matrix',
    name: 'Сгибания ног сидя (Matrix)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'matrix',
  },
  {
    id: 'leg_curl_seated_technogym',
    name: 'Сгибания ног сидя (Technogym)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'technogym',
  },
  {
    id: 'leg_curl_lying_matrix',
    name: 'Сгибания ног лежа (Matrix)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'matrix',
  },
  {
    id: 'leg_curl_lying_technogym',
    name: 'Сгибания ног лежа (Technogym)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'technogym',
  },

  // 8. Широчайшие (B)
  {
    id: 'lat_pulldown_matrix',
    name: 'Вертикальная тяга верхнего блока (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
  },
  {
    id: 'lat_pulldown_technogym',
    name: 'Вертикальная тяга верхнего блока (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
  },
  {
    id: 'gravitron_pullups_matrix_b',
    name: 'Подтягивания в гравитроне (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
  },
  {
    id: 'gravitron_pullups_technogym_b',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
  },
  {
    id: 'hammer_lat_pull_matrix_b',
    name: 'Тяга в Хаммере (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
  },
  {
    id: 'hammer_lat_pull_technogym_b',
    name: 'Тяга в Хаммере (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
  },
  {
    id: 'pullups_bodyweight_b',
    name: 'Подтягивания (Свободный вес)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'free_weight',
    isBodyweight: true,
  },

  // 9. Середина спины (B)
  {
    id: 'dumbbell_row_incline_b',
    name: 'Тяга двух гантелей на наклонной скамье',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'free_weight',
  },
  {
    id: 'seated_cable_row_matrix_b',
    name: 'Тяга горизонтального блока сидя (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'matrix',
  },
  {
    id: 'seated_cable_row_technogym_b',
    name: 'Тяга горизонтального блока сидя (Technogym)',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'technogym',
  },
  {
    id: 'barbell_bent_row_b',
    name: 'Тяга штанги к поясу',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'free_weight',
  },

  // 10. Грудь изоляция (B)
  {
    id: 'pec_deck_matrix',
    name: 'Сведения рук в Пек-Дек («Бабочка») (Matrix)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'matrix',
  },
  {
    id: 'pec_deck_technogym',
    name: 'Сведения рук в Пек-Дек («Бабочка») (Technogym)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'technogym',
  },
  {
    id: 'crossover_flyes_matrix',
    name: 'Сведения рук в кроссовере (Matrix)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'matrix',
  },
  {
    id: 'crossover_flyes_technogym',
    name: 'Сведения рук в кроссовере (Technogym)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'technogym',
  },

  // 11. Задняя дельта (B)
  {
    id: 'reverse_fly_matrix',
    name: 'Обратная бабочка (Reverse Pec-Deck) (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'matrix',
  },
  {
    id: 'reverse_fly_technogym',
    name: 'Обратная бабочка (Reverse Pec-Deck) (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'technogym',
  },
  {
    id: 'face_pull_matrix',
    name: 'Тяга к лицу (Face Pull) в кроссовере (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'matrix',
  },
  {
    id: 'face_pull_technogym',
    name: 'Тяга к лицу (Face Pull) в кроссовере (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'technogym',
  },

  // 12. Бицепс (B)
  {
    id: 'biceps_machine_matrix',
    name: 'Тренажер на бицепс (Matrix)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'matrix',
  },
  {
    id: 'biceps_machine_technogym',
    name: 'Тренажер рычажный (Technogym)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'technogym',
  },
  {
    id: 'biceps_ez_bar',
    name: 'Сгибания рук с EZ-грифом',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
  },
  {
    id: 'biceps_dumbbells_incline',
    name: 'Сгибания рук с гантелями (на наклонной скамье)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
  },
];

export function getOptionsForExercise(
  exerciseId: string,
  gymBrand?: string
): MachineOption[] {
  const options = MACHINE_OPTIONS.filter(opt => opt.exerciseId === exerciseId);
  if (!gymBrand || gymBrand === 'other') return options;

  // Filter options by current gym brand + free_weight options
  const filtered = options.filter(
    opt => opt.brand === 'free_weight' || opt.brand === 'both' || opt.brand === gymBrand
  );

  return filtered.length > 0 ? filtered : options;
}

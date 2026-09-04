export interface MachineOption {
  id: string;
  name: string;
  muscleGroup: string;
  exerciseId: string;
  brand: 'matrix' | 'technogym' | 'free_weight' | 'both';
  isBodyweight?: boolean;
  isBlockMachine?: boolean; // True for block/cable stack machines (pin-loaded tiles marked in lbs on Matrix)
  focusNotes?: string;
}

export const MACHINE_OPTIONS: MachineOption[] = [
  // 1. Квадрицепс (a-1.1)
  {
    id: 'leg_press_matrix',
    name: 'Жим ногами платформой (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded platform
    focusNotes: 'Стопы ставим низко на платформе (на ширине плеч). Глубокий опуск до угла 90° в коленях для мощного растяжения квадрицепса. Пауза 1 сек внизу, мощный выжим без «втыкания» коленей.',
  },
  {
    id: 'leg_press_technogym',
    name: 'Жим ногами платформой (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Опускаем платформу плавно и глубоко. Стопы чуть ниже центра платформы для акцента на квадрицепс. В коленях не блокируем вверху.',
  },

  // 2. Широчайшие (A - a-1.2)
  {
    id: 'pullover_cable_matrix',
    name: 'Пуловер на верхнем блоке (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Корпус чуть наклонен вперед, локти слегка согнуты и зафиксированы. Вверху даем тросу растянуть широчайшие, затем мощно притягиваем канат к бедрам.',
  },
  {
    id: 'pullover_cable_technogym',
    name: 'Пуловер на верхнем блоке (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Канатная рукоять. Движение строго локтями дугой вниз к бедрам. Поясница не прогибается.',
  },
  {
    id: 'gravitron_pullups_matrix',
    name: 'Подтягивания в гравитроне (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded counterweight stack
    focusNotes: 'Грудь направлена навстречу коленям/грифу. Вверху сводим лопатки и притягиваем локти к ребрам, внизу полное растяжение.',
  },
  {
    id: 'gravitron_pullups_technogym',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Широкий или средний хват. Контролируемый подъем с акцентом на широчайшие мышцы спины.',
  },
  {
    id: 'hammer_lat_pull_matrix',
    name: 'Тяга в Хаммере / рычажном (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded
    focusNotes: 'Упор грудью в подушку. Тяга рычагов к поясу, акцент на нижний и средний отдел широчайших спины.',
  },
  {
    id: 'hammer_lat_pull_technogym',
    name: 'Тяга в Хаммере / рычажном (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажный тренажер Technogym. Тянем локти назад к поясу, прожимая широчайшие в пиковой точке.',
  },
  {
    id: 'pullups_bodyweight',
    name: 'Подтягивания (Свободный вес)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'free_weight',
    isBodyweight: true,
    isBlockMachine: false,
    focusNotes: 'Подтягивания под своим весом. Хват чуть шире плеч, грудь вверх.',
  },

  // 3. Верх груди (A - a-2.1)
  {
    id: 'smith_upper_chest_matrix',
    name: 'Жим в Смите на наклонной скамье (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
    isBlockMachine: false, // Barbell & plates
    focusNotes: 'Угол скамьи 25–30°. Опускаем штангу точно на ключичную зону груди. Угол направляет нагрузку именно в верхний пучок.',
  },
  {
    id: 'smith_upper_chest_technogym',
    name: 'Жим в Смите на наклонной скамье (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Смит Technogym. Опускание до касания верхней части груди, плечи опущены, лопатки сводим.',
  },
  {
    id: 'hammer_upper_chest_matrix',
    name: 'Жим в Хаммере на верх груди (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded
    focusNotes: 'Рычажный жим на верх груди. Отрегулируйте сиденье так, чтобы рукояти находились на уровне верхней части груди. Лопатки прижаты к спинке.',
  },
  {
    id: 'hammer_upper_chest_technogym',
    name: 'Жим в Хаммере на верх груди (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Жим в рычажном тренажере Technogym на наклонную грудь. Жмем плавно вперед и вверх, сохраняя натяжение верхней части грудных.',
  },
  {
    id: 'dips_free_weight_upper',
    name: 'Брусья (Свободный вес)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBodyweight: true,
    isBlockMachine: false,
    focusNotes: 'Наклон корпуса вперед ~30°, локти чуть в стороны. Глубокий опуск до натяжения грудных.',
  },
  {
    id: 'dips_gravitron_matrix_upper',
    name: 'Брусья в гравитроне (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
    isBlockMachine: true, // Block stack counterweight
    focusNotes: 'Отжимания на брусьях с противовесом. Корпус наклонен вперед для перевода нагрузки на грудь.',
  },
  {
    id: 'dips_gravitron_technogym_upper',
    name: 'Брусья в гравитроне (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Гравитрон Technogym. Наклон вперед, контролируемый опуск и мощный выжим.',
  },

  // 4. Середина спины (A - a-2.2)
  {
    id: 'dumbbell_row_incline',
    name: 'Тяга гантелей к поясу в наклоне',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'free_weight',
    isBlockMachine: false, // Dumbbells
    focusNotes: 'Ведем гантели под углом к поясу, отводя локти в стороны под ~45–60° и в верхней точке максимально сжимая лопатки вместе.',
  },
  {
    id: 'seated_cable_row_matrix',
    name: 'Тяга горизонтального блока сидя (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Спина прямая, притягиваем рукоять к низу живота, сводя лопатки в пиковой точке на 1 секунду.',
  },
  {
    id: 'seated_cable_row_technogym',
    name: 'Тяга горизонтального блока сидя (Technogym)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Горизонтальная тяга Technogym. Мощный прожим ромбовидных и средней трапеции со сведенными лопатками.',
  },
  {
    id: 'barbell_bent_row',
    name: 'Тяга штанги к поясу',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'free_weight',
    isBlockMachine: false, // Barbell
    focusNotes: 'Наклон корпуса 45°, спина ровная. Тяга штанги к низу живота с паузой вверху.',
  },

  // 5. Низ груди / Трицепс (A - a-3.1)
  {
    id: 'dips_lower_chest_bodyweight',
    name: 'Отжимания на брусьях (Свободный вес)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'free_weight',
    isBodyweight: true,
    isBlockMachine: false,
    focusNotes: 'Наклон корпуса вперед 30°, локти чуть в стороны для перевода нагрузки на волокна нижнего отдела грудных и трицепс.',
  },
  {
    id: 'dips_gravitron_lower_matrix',
    name: 'Отжимания в гравитроне (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: true, // Block stack
    focusNotes: 'Отжимания с поддержкой в гравитроне. Корпус с наклоном вперед 30°, глубокий провал до растяжения нижней части грудных.',
  },
  {
    id: 'dips_gravitron_lower_technogym',
    name: 'Отжимания в гравитроне (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Гравитрон Technogym. Контролируемый разгиб рук и работа нижней части грудных.',
  },
  {
    id: 'hammer_lower_chest_matrix',
    name: 'Жим в Хаммере на низ груди (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded
    focusNotes: 'Рычажный жим в Хаммере на низ груди. Сиденье отрегулировано так, чтобы рукояти выжимались вниз и вперед. Максимальное сжатие груди в пике.',
  },
  {
    id: 'hammer_lower_chest_technogym',
    name: 'Жим в Хаммере на низ груди (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажный жим Technogym для нижней части груди. Спина плотно прижата, выжим вниз и вперед.',
  },

  // 6. Средняя дельта (A - a-3.2)
  {
    id: 'dumbbell_lateral_raises',
    name: 'Махи гантелями в стороны',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'free_weight',
    isBlockMachine: false, // Dumbbells
    focusNotes: 'Локти чуть выше запястий, подъем строго за счет средней дельты для визуального расширения плеч.',
  },
  {
    id: 'crossover_lateral_raises_matrix',
    name: 'Протяжка / махи в кроссовере (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Трос от нижнего блока. Мах в сторону-вверх с постоянным натяжением троса на среднюю дельту.',
  },
  {
    id: 'crossover_lateral_raises_technogym',
    name: 'Протяжка / махи в кроссовере (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Махи в кроссовере Technogym. Плавная работа без инерции, подъем до уровня плеч.',
  },

  // 7. Бицепс бедра (B - b-1.1)
  {
    id: 'leg_curl_seated_matrix',
    name: 'Сгибания ног сидя (Matrix)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded block stack
    focusNotes: 'Медленное опускание (3 секунды). Плотно прижимаем бедра валиком, мощности сгибания в полной амплитуде.',
  },
  {
    id: 'leg_curl_seated_technogym',
    name: 'Сгибания ног сидя (Technogym)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Сгибание ног Technogym. 3 секунды на негативную фазу, пиковый зажим бицепса бедра.',
  },
  {
    id: 'leg_curl_lying_matrix',
    name: 'Сгибания ног лежа (Matrix)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded block stack
    focusNotes: 'Таз прижат к скамье, сгибание ног до касания валиком ягодиц.',
  },
  {
    id: 'leg_curl_lying_technogym',
    name: 'Сгибания ног лежа (Technogym)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Лежа на скамье Technogym. Сохраняем таз неподвижным, работаем бицепсом бедра.',
  },

  // 8. Широчайшие (B - b-1.2)
  {
    id: 'lat_pulldown_matrix',
    name: 'Вертикальная тяга верхнего блока (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Полное растяжение широчайших вверху, тяга грудью навстречу грифу, локти направлены строго вниз.',
  },
  {
    id: 'lat_pulldown_technogym',
    name: 'Вертикальная тяга верхнего блока (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Тяга Technogym к груди. Сводим лопатки и прижимаем локти к туловищу.',
  },
  {
    id: 'gravitron_pullups_matrix_b',
    name: 'Подтягивания в гравитроне (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
    isBlockMachine: true, // Block stack
    focusNotes: 'Гравитрон Matrix. Широкий хват, тяга грудью к перекладине.',
  },
  {
    id: 'gravitron_pullups_technogym_b',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Подтягивания с разгрузкой Technogym. Работа спиной.',
  },
  {
    id: 'hammer_lat_pull_matrix_b',
    name: 'Тяга в Хаммере (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded
    focusNotes: 'Рычажная тяга на широчайшие Matrix. Тянем к поясу, прожимая спину.',
  },
  {
    id: 'hammer_lat_pull_technogym_b',
    name: 'Тяга в Хаммере (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Тяга рычагов Technogym. Упор грудью, акцент на V-форму спины.',
  },
  {
    id: 'pullups_bodyweight_b',
    name: 'Подтягивания (Свободный вес)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'free_weight',
    isBodyweight: true,
    isBlockMachine: false,
    focusNotes: 'Классические подтягивания широким хватом.',
  },

  // 9. Середина спины (B - b-2.1)
  {
    id: 'dumbbell_row_incline_b',
    name: 'Тяга двух гантелей на наклонной скамье',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'free_weight',
    isBlockMachine: false, // Dumbbells
    focusNotes: 'Лежа на животе на скамье 30°. Поясница полностью разгружена. Хват нейтральный, локти ведем через стороны с фиксацией в пике 1 сек.',
  },
  {
    id: 'seated_cable_row_matrix_b',
    name: 'Тяга горизонтального блока сидя (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'matrix',
    isBlockMachine: true, // Block stack
    focusNotes: 'Горизонтальная тяга Matrix к поясу со сведенными лопатками.',
  },
  {
    id: 'seated_cable_row_technogym_b',
    name: 'Тяга горизонтального блока сидя (Technogym)',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Тяга блока Technogym на середину спины.',
  },
  {
    id: 'barbell_bent_row_b',
    name: 'Тяга штанги к поясу',
    muscleGroup: 'Середина спины',
    exerciseId: 'b-2.1',
    brand: 'free_weight',
    isBlockMachine: false, // Barbell
    focusNotes: 'Тяга штанги в наклоне с упором на лопатки.',
  },

  // 10. Грудь изоляция (B - b-2.2)
  {
    id: 'pec_deck_matrix',
    name: 'Сведения рук в Пек-Дек («Бабочка») (Matrix)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded block stack
    focusNotes: 'Чистая изоляция груди без участия рук и плеч. Отличное глубокое растяжение в эксцентрической фазе и сжатие в пике.',
  },
  {
    id: 'pec_deck_technogym',
    name: 'Сведения рук в Пек-Дек («Бабочка») (Technogym)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Бабочка Technogym. Сведение локтей перед грудью с задержкой в 1 сек.',
  },
  {
    id: 'crossover_flyes_matrix',
    name: 'Сведения рук в кроссовере (Matrix)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Кроссовер Matrix. Сведение тросов перед собой с пиковым прожимом груди.',
  },
  {
    id: 'crossover_flyes_technogym',
    name: 'Сведения рук в кроссовере (Technogym)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Кроссовер Technogym. Постоянное натяжение грудных мышц.',
  },

  // 11. Задняя дельта (B - b-3.1)
  {
    id: 'reverse_fly_matrix',
    name: 'Обратная бабочка (Reverse Pec-Deck) (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded block stack
    focusNotes: 'Разворачивает плечи назад, убирает сутулость и формирует мощный задний пучок плеча.',
  },
  {
    id: 'reverse_fly_technogym',
    name: 'Обратная бабочка (Reverse Pec-Deck) (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Обратная бабочка Technogym. Разведение рук назад за счет задней дельты.',
  },
  {
    id: 'face_pull_matrix',
    name: 'Тяга к лицу (Face Pull) в кроссовере (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Тяга канатной рукояти к лбу/глазам, разводя кисти в стороны для выравнивания осанки.',
  },
  {
    id: 'face_pull_technogym',
    name: 'Тяга к лицу (Face Pull) в кроссовере (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-3.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Face Pull Technogym. Внешнее вращение плеча и работа задней дельты.',
  },

  // 12. Бицепс (B - b-3.2)
  {
    id: 'biceps_machine_matrix',
    name: 'Тренажер на бицепс (Matrix)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'matrix',
    isBlockMachine: true, // Pin-loaded block stack
    focusNotes: 'Локти зафиксированы на подушке. Изолированное сгибание рук на бицепс.',
  },
  {
    id: 'biceps_machine_technogym',
    name: 'Тренажер рычажный (Technogym)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Рычажный бицепс-тренажер Technogym. Плавный подъём и медленное опускание.',
  },
  {
    id: 'biceps_ez_bar',
    name: 'Сгибания рук с EZ-грифом',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Сгибания с изогнутым грифом стоя, локти прижаты к туловищу.',
  },
  {
    id: 'biceps_dumbbells_incline',
    name: 'Сгибания рук с гантелями (на наклонной скамье)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Локти остаются сзади корпуса на наклонной скамье 45–60°. Это максимально натягивает длинную головку бицепса.',
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

export function isBlockMachineOption(machineName?: string): boolean {
  if (!machineName) return false;
  const match = MACHINE_OPTIONS.find(opt => opt.name === machineName);
  if (match) return !!match.isBlockMachine;

  // Fallback heuristic if string contains block keywords
  const lower = machineName.toLowerCase();
  if (
    lower.includes('платформ') ||
    lower.includes('смит') ||
    lower.includes('хаммер') ||
    lower.includes('гантел') ||
    lower.includes('штанг') ||
    lower.includes('брусья (свободный') ||
    lower.includes('подтягивания (свободный')
  ) {
    return false;
  }
  return (
    lower.includes('блок') ||
    lower.includes('кроссовер') ||
    lower.includes('гравитрон') ||
    lower.includes('пек-дек') ||
    lower.includes('бабочка') ||
    lower.includes('сгибания ног') ||
    lower.includes('тренажер на бицепс')
  );
}

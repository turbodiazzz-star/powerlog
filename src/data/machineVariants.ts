export interface MachineOption {
  id: string;
  name: string;
  muscleGroup: string;
  exerciseId: string;
  brand: 'matrix' | 'technogym' | 'free_weight' | 'both';
  isBodyweight?: boolean;
  isAssisted?: boolean; // Gravitron: logged kg is counterweight (subtracted from bodyweight)
  isBlockMachine?: boolean; // True for block/cable stack machines (pin-loaded tiles marked in lbs on Matrix)
  baseTareWeight?: number; // Base starting weight of empty platform or Smith bar in kg
  focusNotes?: string;
}

export const MACHINE_OPTIONS: MachineOption[] = [
  {
    id: 'technogym_pulldown_user_photo_a',
    name: 'Тяга верхнего блока Pulldown (Technogym, фото)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Тренажёр Technogym Pulldown с фото пользователя. Тяни локти вниз к корпусу, без раскачки.',
  },
  {
    id: 'technogym_pulldown_user_photo_b',
    name: 'Тяга верхнего блока Pulldown (Technogym, фото)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Тренажёр Technogym Pulldown с фото пользователя. Тяни локти вниз к корпусу, без раскачки.',
  },
  // 1. Квадрицепс (a-1.1)
  {
    id: 'leg_press_matrix',
    name: 'Жим ногами платформой (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded platform
    baseTareWeight: 47, // Empty platform carriage tare weight ~47kg
    focusNotes: 'Стопы ставим низко на платформе (на ширине плеч). Пустая платформа весит 47 кг (указывайте только вес навешанных блинов). Глубокий опуск до 90°, пауза 1 сек.',
  },
  {
    id: 'leg_press_technogym',
    name: 'Жим ногами платформой (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 48, // Pure Strength empty sled weight ~48kg
    focusNotes: 'Опускаем платформу плавно и глубоко. Пустая платформа весит 48 кг (указывайте только вес блинов). В коленях не блокируем вверху.',
  },
  {
    id: 'leg_press_block_matrix',
    name: 'Жим ногами блочный / стек (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
    isBlockMachine: true, // Cable/pin-loaded stack
    focusNotes: 'Блочный (стековый) жим ногами Matrix. Выбираем плитки штифтом на стеке, выжимаем платформу плавно.',
  },
  {
    id: 'leg_press_block_technogym',
    name: 'Жим ногами блочный / стек (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Блочный (стековый) жим ногами Technogym (Selection/Element). Выбираем вес штифтом на стеке.',
  },
  {
    id: 'hack_squat_matrix',
    name: 'Жим ногами / гакк рычажный (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
    isBlockMachine: false,
    baseTareWeight: 30,
    focusNotes: 'Рычажный гакк/салазки. Указывайте только блины: пустая каретка ~30 кг. Глубокий опуск.',
  },
  {
    id: 'hack_squat_technogym',
    name: 'Жим ногами / гакк рычажный (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 32,
    focusNotes: 'Рычажный гакк Technogym. Блины + каретка. Не блокируйте колени вверху.',
  },
  {
    id: 'leg_extension_matrix',
    name: 'Разгибания ног блочные сидя (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'l-3.1',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Валик на нижней трети голени. Полная амплитуда, пиковое сжатие квадрицепса вверху 1 сек.',
  },
  {
    id: 'leg_extension_technogym',
    name: 'Разгибания ног блочные сидя (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'l-3.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Разгибания Technogym Selection. Без рывка, контроль негатива.',
  },
  {
    id: 'leg_extension_lever_matrix',
    name: 'Разгибания ног рычажные / блины (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'l-3.1',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Рычажные разгибания под блины. Контроль негатива.',
  },
  {
    id: 'leg_extension_lever_technogym',
    name: 'Разгибания ног рычажные / блины (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'l-3.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажные разгибания Technogym под блины.',
  },
  {
    id: 'smith_squat_matrix',
    name: 'Приседания в Смите (Matrix)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'matrix',
    isBlockMachine: false,
    baseTareWeight: 11,
    focusNotes: 'Гриф 11 кг + блины. Стопы чуть впереди, глубина до параллели или ниже.',
  },
  {
    id: 'smith_squat_technogym',
    name: 'Приседания в Смите (Technogym)',
    muscleGroup: 'Квадрицепс',
    exerciseId: 'a-1.1',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 8,
    focusNotes: 'Multipower ~8 кг гриф + блины. Спина нейтральная.',
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
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Указывайте вес РАЗГРУЗКИ (противовес). Рабочий вес = ваш вес − разгрузка. Грудь к перекладине, локти к ребрам.',
  },
  {
    id: 'gravitron_pullups_technogym',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Вес в поле — разгрузка, не нагрузка. Рабочий вес = вес тела − противовес. Средний/широкий хват.',
  },
  {
    id: 'lat_pulldown_wide_matrix_a',
    name: 'Вертикальная тяга широким хватом (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Широкий хват сверху, тяга к верхней груди, локти вниз-в стороны. Полное растяжение вверху.',
  },
  {
    id: 'lat_pulldown_wide_technogym_a',
    name: 'Вертикальная тяга широким хватом (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Широкий хват Technogym. Тяга грудью к грифу, без раскачки корпусом.',
  },
  {
    id: 'lat_pulldown_close_matrix_a',
    name: 'Вертикальная тяга узким/нейтральным хватом (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'V-рукоять или узкий хват. Тяга к верху груди, локти вдоль корпуса — толщина широчайших.',
  },
  {
    id: 'lat_pulldown_close_technogym_a',
    name: 'Вертикальная тяга узким/нейтральным хватом (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Нейтральная рукоять Technogym. Тяга к груди, акцент на нижнюю часть широчайших.',
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
  {
    id: 'technogym_converging_lat',
    name: 'Вертикальная тяга сходящимися рукоятями / по дуге (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'a-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes:
      'Только Technogym: сидя, две независимые рукояти идут по дуге (не строго вертикально вниз). Тяни к верхней груди, локти вниз-назад.',
  },

  // 3. Верх груди (A - a-2.1)
  {
    id: 'smith_upper_chest_matrix',
    name: 'Жим в Смите на наклонной скамье (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'matrix',
    isBlockMachine: false, // Barbell & plates
    baseTareWeight: 11, // Empty Smith bar starting weight ~11kg
    focusNotes: 'Угол скамьи 25–30°. Пустой гриф весит 11 кг (указывайте только вес навешанных блинов). Опускаем штангу точно на ключичную зону груди.',
  },
  {
    id: 'smith_upper_chest_technogym',
    name: 'Жим в Смите на наклонной скамье (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 8, // Multipower empty Smith bar starting resistance ~8kg
    focusNotes: 'Смит Technogym Multipower. Пустой гриф весит 8 кг (указывайте только вес навешанных блинов). Опускание до касания верхней части груди.',
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
    id: 'barbell_incline_press',
    name: 'Жим штанги на наклонной скамье',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Свободная штанга, наклон 25–30°. Не основной вариант — по желанию.',
  },
  {
    id: 'barbell_flat_press',
    name: 'Жим штанги лёжа горизонтально',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Классический жим лёжа. Запасной вариант, не на постоянной основе.',
  },
  {
    id: 'dumbbell_incline_press',
    name: 'Жим гантелей на наклонной скамье',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Наклон 25–30°, гантели. Вариант по желанию.',
  },
  {
    id: 'dumbbell_flat_press',
    name: 'Жим гантелей лёжа горизонтально',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Горизонтальная скамья, гантели. Вариант по желанию.',
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
    isAssisted: true,
    isBlockMachine: true, // Block stack counterweight
    focusNotes: 'Разгрузка (минус кг), не плюс. Рабочий вес = вес тела − противовес. Корпус наклонён вперёд для груди.',
  },
  {
    id: 'dips_gravitron_technogym_upper',
    name: 'Брусья в гравитроне (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'a-2.1',
    brand: 'technogym',
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Гравитрон Technogym: вписывайте разгрузку. Рабочий вес = вес тела − кг на стеке. Наклон вперёд.',
  },

  // 4. Середина спины (A - a-2.2)
  {
    id: 'dumbbell_row_incline',
    name: 'Тяга гантели к поясу в наклоне',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'free_weight',
    isBlockMachine: false, // Dumbbells
    focusNotes: 'Ведем гантель к поясу, локоть ~45–60°, вверху сжимаем лопатку 1 сек.',
  },
  {
    id: 'seated_cable_row_matrix',
    name: 'Горизонтальная тяга блока сидя (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Спина прямая, притягиваем рукоять к низу живота, сводя лопатки в пиковой точке на 1 секунду.',
  },
  {
    id: 'seated_cable_row_technogym',
    name: 'Горизонтальная тяга блока сидя (Technogym)',
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
    isBlockMachine: false,
    focusNotes: 'Наклон корпуса 45°, спина ровная. Тяга штанги к низу живота с паузой вверху.',
  },
  {
    id: 'chest_supported_row_matrix',
    name: 'Тяга с упором в грудь (Matrix)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Рычажная тяга с подушкой. Локти 45–60°, сведение лопаток.',
  },
  {
    id: 'chest_supported_row_technogym',
    name: 'Тяга с упором в грудь (Technogym)',
    muscleGroup: 'Середина спины',
    exerciseId: 'a-2.2',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Chest-supported row Technogym. Поясница разгружена.',
  },

  // 5. Низ груди / Трицепс (A - a-3.1) — брусья
  {
    id: 'dips_gravitron_lower_matrix',
    name: 'Брусья в гравитроне (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'В поле — РАЗГРУЗКА. Рабочий = вес тела − стек. Наклон корпуса ~30° под грудь.',
  },
  {
    id: 'dips_gravitron_lower_technogym',
    name: 'Брусья в гравитроне (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Противовес вычитается из веса тела. Контролируемый разгиб.',
  },
  {
    id: 'dips_lower_chest_bodyweight',
    name: 'Брусья со своим весом',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'free_weight',
    isBodyweight: true,
    isBlockMachine: false,
    focusNotes: 'Наклон корпуса вперед 30°, локти чуть в стороны. Вес в поле = 0 или добавленный пояс.',
  },
  {
    id: 'dips_lever_matrix',
    name: 'Брусья / отжимания в рычажном тренажёре (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Рычажный dip-тренажёр под блины. Наклон под грудь.',
  },
  {
    id: 'dips_lever_technogym',
    name: 'Брусья / отжимания в рычажном тренажёре (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажный dip Technogym. Запасной вариант вместо гравитрона.',
  },
  {
    id: 'hammer_lower_chest_matrix',
    name: 'Жим в Хаммере на низ груди (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: false, // Plate-loaded
    focusNotes: 'Рычажный жим в Хаммере на низ груди. Сиденье: рукояти вниз-вперёд.',
  },
  {
    id: 'hammer_lower_chest_technogym',
    name: 'Жим в Хаммере на низ груди (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажный жим Technogym для нижней части груди.',
  },
  {
    id: 'chest_press_matrix',
    name: 'Жим от груди сидя / Chest Press (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Классический Chest Press Matrix. Рукояти на уровне середины груди, лопатки сведены.',
  },
  {
    id: 'chest_press_technogym',
    name: 'Жим от груди сидя / Chest Press (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Chest Press Technogym Selection. Плавный выжим без отрыва спины.',
  },
  {
    id: 'decline_smith_matrix',
    name: 'Жим в Смите на нижней скамье (Matrix)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'matrix',
    isBlockMachine: false,
    baseTareWeight: 11,
    focusNotes: 'Небольшой отрицательный угол. Гриф 11 кг + блины. Опускание на низ груди.',
  },
  {
    id: 'decline_smith_technogym',
    name: 'Жим в Смите на нижней скамье (Technogym)',
    muscleGroup: 'Низ груди / Трицепс',
    exerciseId: 'a-3.1',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 8,
    focusNotes: 'Смит Technogym, гриф ~8 кг + блины. Акцент на нижний пучок.',
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
    name: 'Махи в кроссовере на блоке (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'matrix',
    isBlockMachine: true, // Cable block stack
    focusNotes: 'Трос от нижнего блока. Мах в сторону-вверх с постоянным натяжением троса на среднюю дельту.',
  },
  {
    id: 'crossover_lateral_raises_technogym',
    name: 'Махи в кроссовере на блоке (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Махи в кроссовере Technogym. Плавная работа без инерции, подъем до уровня плеч.',
  },
  {
    id: 'lateral_raise_machine_matrix',
    name: 'Махи сидя в тренажёре (валики под локтями, Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Сидя, валики/подушки под локтями, рукояти в руках. Подъём локтей в стороны без читинга корпусом.',
  },
  {
    id: 'lateral_raise_machine_technogym',
    name: 'Махи сидя в тренажёре (валики под локтями, Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Сидя, валики под локтями. Строго средняя дельта, контроль негатива.',
  },
  {
    id: 'shoulder_press_matrix_a',
    name: 'Жим вверх на плечи (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Жим вверх в тренажёре Matrix. Спина прижата, не переразгибай поясницу.',
  },
  {
    id: 'shoulder_press_technogym_a',
    name: 'Жим вверх на плечи (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Жим вверх в тренажёре Technogym. Движение плавное, локти под кистями.',
  },
  {
    id: 'dumbbell_shoulder_press_a',
    name: 'Жим гантелей вверх',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'a-3.2',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Жим гантелей вверх сидя. Не своди плечи к ушам и не прогибай поясницу.',
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
  {
    id: 'rdl_dumbbells',
    name: 'Румынская тяга с гантелями',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Мягкие колени, таз назад, гантели скользят вдоль бёдер. Растяжка бицепса бедра внизу.',
  },
  {
    id: 'seated_leg_curl_alt_matrix',
    name: 'Сгибания ног стоя / одной ногой (Matrix)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Поочерёдные сгибания. Таз стабилен, без раскачки.',
  },
  {
    id: 'seated_leg_curl_alt_technogym',
    name: 'Сгибания ног стоя / одной ногой (Technogym)',
    muscleGroup: 'Бицепс бедра',
    exerciseId: 'b-1.1',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Изоляция одной ноги Technogym. Медленный негатив.',
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
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Разгрузка, не нагрузка. Рабочий вес = вес тела − стек. Широкий хват.',
  },
  {
    id: 'gravitron_pullups_technogym_b',
    name: 'Подтягивания в гравитроне (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isAssisted: true,
    isBlockMachine: true,
    focusNotes: 'Указывайте противовес. Эффект = вес тела минус разгрузка.',
  },
  {
    id: 'lat_pulldown_close_matrix_b',
    name: 'Вертикальная тяга узким/нейтральным хватом (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'V-рукоять / узкий хват к груди. Локти вдоль корпуса.',
  },
  {
    id: 'lat_pulldown_close_technogym_b',
    name: 'Вертикальная тяга узким/нейтральным хватом (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Нейтральный хват Technogym. Полное растяжение широчайших вверху.',
  },
  {
    id: 'lat_pulldown_wide_matrix_b',
    name: 'Вертикальная тяга широким хватом (Matrix)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Широкий хват сверху, тяга к ключицам, локти вниз.',
  },
  {
    id: 'lat_pulldown_wide_technogym_b',
    name: 'Вертикальная тяга широким хватом (Technogym)',
    muscleGroup: 'Широчайшие',
    exerciseId: 'b-1.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Широкий хват Technogym. Грудь вверх навстречу грифу.',
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
  {
    id: 'incline_pec_deck_matrix',
    name: 'Сведения на наклонной бабочке (Matrix)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Сиденье ниже — вектор на верх груди. Сведение локтей перед лицом.',
  },
  {
    id: 'incline_pec_deck_technogym',
    name: 'Сведения на наклонной бабочке (Technogym)',
    muscleGroup: 'Грудь (изоляция)',
    exerciseId: 'b-2.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Pec Deck Technogym с акцентом на верх. Пауза в пике.',
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
    name: 'Бицепс рычажный / скамья Скотта под блины (Technogym)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычаг или скамья Скотта с блинами. Плавный подъём, медленный негатив.',
  },
  {
    id: 'biceps_ez_bar',
    name: 'Сгибания стоя с EZ-грифом',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Сгибания с изогнутым грифом стоя, локти прижаты к туловищу.',
  },
  {
    id: 'biceps_dumbbells_incline',
    name: 'Сгибания с гантелями (наклон / стоя)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Наклон 45–60° или стоя. Локти стабильны, без раскачки.',
  },
  {
    id: 'preacher_curl_matrix',
    name: 'Скамья Скотта под блины (Matrix)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Локти на пюпитре, блины на гриф. Полная амплитуда без отрыва плеч.',
  },
  {
    id: 'preacher_curl_technogym',
    name: 'Скамья Скотта под блины (Technogym)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Проповедник Technogym под блины. Медленный негатив.',
  },
  {
    id: 'cable_curl_matrix',
    name: 'Сгибания на блоке в кроссовере (Matrix)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Нижний блок, прямая или EZ-рукоять. Локти прижаты, постоянное натяжение.',
  },
  {
    id: 'cable_curl_technogym',
    name: 'Сгибания на блоке в кроссовере (Technogym)',
    muscleGroup: 'Бицепс',
    exerciseId: 'b-3.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Нижний блок Technogym. Постоянное натяжение бицепса.',
  },
  {
    id: 'smith_upper_chest_matrix_b',
    name: 'Жим в Смите на наклонной скамье (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'b-2.3',
    brand: 'matrix',
    isBlockMachine: false,
    baseTareWeight: 11,
    focusNotes: 'Наклон 25–30°, опускание к ключичной зоне груди.',
  },
  {
    id: 'smith_upper_chest_technogym_b',
    name: 'Жим в Смите на наклонной скамье (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'b-2.3',
    brand: 'technogym',
    isBlockMachine: false,
    baseTareWeight: 8,
    focusNotes: 'Наклон 25–30°, плавный жим на верх груди.',
  },
  {
    id: 'hammer_upper_chest_matrix_b',
    name: 'Жим в Хаммере на верх груди (Matrix)',
    muscleGroup: 'Верх груди',
    exerciseId: 'b-2.3',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Жим в Хаммере на верх груди. Рукояти на уровне верхней части груди.',
  },
  {
    id: 'hammer_upper_chest_technogym_b',
    name: 'Жим в Хаммере на верх груди (Technogym)',
    muscleGroup: 'Верх груди',
    exerciseId: 'b-2.3',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Жим в рычажном тренажере на верх груди. Двигайся плавно, сохраняя лопатки на спинке.',
  },
  {
    id: 'face_pull_matrix_b',
    name: 'Face Pull в кроссовере (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-2.4',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Тяни канат к лицу и разводи кисти наружу для задней дельты.',
  },
  {
    id: 'face_pull_technogym_b',
    name: 'Face Pull в кроссовере (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-2.4',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Тяга канатной рукояти к лицу с контролем и без рывка.',
  },
  {
    id: 'reverse_pec_deck_matrix_b',
    name: 'Обратная бабочка / Pec Deck rear (Matrix)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-2.4',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Грудь в подушку, разведение рук назад за счёт задней дельты, без рывка.',
  },
  {
    id: 'reverse_pec_deck_technogym_b',
    name: 'Обратная бабочка / Pec Deck rear (Technogym)',
    muscleGroup: 'Задняя дельта',
    exerciseId: 'b-2.4',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Обратная бабочка Technogym. Локти чуть согнуты, своди лопатки.',
  },
  {
    id: 'shoulder_press_lever_matrix_b',
    name: 'Жим вверх сидя рычажный (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'matrix',
    isBlockMachine: false,
    focusNotes: 'Рычажный жим сидя. Спина прижата, выжим вверх без прогиба поясницы.',
  },
  {
    id: 'shoulder_press_lever_technogym_b',
    name: 'Жим вверх сидя рычажный (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'technogym',
    isBlockMachine: false,
    focusNotes: 'Рычажный жим сидя Technogym. Контроль негатива.',
  },
  {
    id: 'dumbbell_shoulder_press_b',
    name: 'Жим гантелей сидя вверх',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'free_weight',
    isBlockMachine: false,
    focusNotes: 'Жим гантелей вверх сидя, корпус стабилен.',
  },
  {
    id: 'shoulder_press_matrix_b',
    name: 'Жим вверх сидя блочный (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Блочный Shoulder Press Matrix. Плавная амплитуда.',
  },
  {
    id: 'shoulder_press_technogym_b',
    name: 'Жим вверх сидя блочный (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Блочный Shoulder Press Technogym. Без рывка.',
  },
  {
    id: 'crossover_lateral_raise_matrix_b',
    name: 'Махи в кроссовере на блоке (Matrix)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Запасной вариант: мах от нижнего блока, если жима нет.',
  },
  {
    id: 'crossover_lateral_raise_technogym_b',
    name: 'Махи в кроссовере на блоке (Technogym)',
    muscleGroup: 'Средняя дельта',
    exerciseId: 'b-3.3',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Запасной вариант: махи от нижнего блока.',
  },

  // Трицепс блок (B - b-5.2)
  {
    id: 'tricep_rope_matrix',
    name: 'Разгибания на трицепс с канатом (Matrix)',
    muscleGroup: 'Трицепс',
    exerciseId: 'b-5.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Канат на верхнем блоке. Локти прижаты к корпусу, разгибание до полного выпрямления.',
  },
  {
    id: 'tricep_rope_technogym',
    name: 'Разгибания на трицепс с канатом (Technogym)',
    muscleGroup: 'Трицепс',
    exerciseId: 'b-5.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Канат Technogym. Локти не гуляют, контроль негатива.',
  },
  {
    id: 'tricep_pushdown_bar_matrix',
    name: 'Разгибания на трицепс прямой рукоятью (Matrix)',
    muscleGroup: 'Трицепс',
    exerciseId: 'b-5.2',
    brand: 'matrix',
    isBlockMachine: true,
    focusNotes: 'Прямая или V-рукоять. Локти фиксированы.',
  },
  {
    id: 'tricep_pushdown_bar_technogym',
    name: 'Разгибания на трицепс прямой рукоятью (Technogym)',
    muscleGroup: 'Трицепс',
    exerciseId: 'b-5.2',
    brand: 'technogym',
    isBlockMachine: true,
    focusNotes: 'Прямая или V-рукоять Technogym. Полная амплитуда.',
  },
];

/** Same movement / equipment pool under a different program slot id. */
const EXERCISE_ID_ALIASES: Record<string, string> = {
  'c-2.1': 'a-2.2',
  'c-3.2': 'b-1.1',
  'c-4.1': 'a-3.2',
  'c-4.2': 'b-2.4',
};

/**
 * Порядок в выпадающем списке (по id опции). Чем раньше — тем выше приоритет.
 * Разные слоты программы (A vs C) могут иметь разный порядок на одном пуле машин.
 */
const VARIANT_PRIORITY: Record<string, string[]> = {
  // День A: Хаммер первым; Смит и штанга — варианты
  'a-2.1': [
    'hammer_upper_chest_matrix',
    'hammer_upper_chest_technogym',
    'smith_upper_chest_matrix',
    'smith_upper_chest_technogym',
    'barbell_incline_press',
    'barbell_flat_press',
    'dumbbell_incline_press',
    'dumbbell_flat_press',
  ],
  'b-2.3': [
    'smith_upper_chest_matrix_b',
    'smith_upper_chest_technogym_b',
    'hammer_upper_chest_matrix_b',
    'hammer_upper_chest_technogym_b',
  ],
  // 2. Тяга дня A: гантель → блок сидя → штанга
  'a-2.2': [
    'dumbbell_row_incline',
    'seated_cable_row_matrix',
    'seated_cable_row_technogym',
    'barbell_bent_row',
    'chest_supported_row_matrix',
    'chest_supported_row_technogym',
  ],
  // 11. День C: горизонтальный блок первым (не дублировать гантель как дефолт)
  'c-2.1': [
    'seated_cable_row_matrix',
    'seated_cable_row_technogym',
    'chest_supported_row_matrix',
    'chest_supported_row_technogym',
    'dumbbell_row_incline',
    'barbell_bent_row',
  ],
  // 3. Жим ногами: платформа → блок → рычаг
  'a-1.1': [
    'leg_press_matrix',
    'leg_press_technogym',
    'leg_press_block_matrix',
    'leg_press_block_technogym',
    'hack_squat_matrix',
    'hack_squat_technogym',
    'smith_squat_matrix',
    'smith_squat_technogym',
  ],
  // 4. Махи дня A: кроссовер → гантели → валики под локтями
  'a-3.2': [
    'crossover_lateral_raises_matrix',
    'crossover_lateral_raises_technogym',
    'dumbbell_lateral_raises',
    'lateral_raise_machine_matrix',
    'lateral_raise_machine_technogym',
  ],
  // 13. День C плечи-махи: кроссовер приоритет (жим рычагом уже был в B)
  'c-4.1': [
    'crossover_lateral_raises_matrix',
    'crossover_lateral_raises_technogym',
    'dumbbell_lateral_raises',
    'lateral_raise_machine_matrix',
    'lateral_raise_machine_technogym',
  ],
  // 5. Вертикальная тяга: гравитрон → блок → свои → рычаг → дуга Technogym
  'a-1.2': [
    'gravitron_pullups_matrix',
    'gravitron_pullups_technogym',
    'technogym_pulldown_user_photo_a',
    'lat_pulldown_wide_matrix_a',
    'lat_pulldown_wide_technogym_a',
    'lat_pulldown_close_matrix_a',
    'lat_pulldown_close_technogym_a',
    'pullups_bodyweight',
    'hammer_lat_pull_matrix',
    'hammer_lat_pull_technogym',
    'technogym_converging_lat',
    'pullover_cable_matrix',
    'pullover_cable_technogym',
  ],
  // 7 / 12. Сгибания: лежа → сидя
  'b-1.1': [
    'leg_curl_lying_matrix',
    'leg_curl_lying_technogym',
    'leg_curl_seated_matrix',
    'leg_curl_seated_technogym',
    'seated_leg_curl_alt_matrix',
    'seated_leg_curl_alt_technogym',
    'rdl_dumbbells',
  ],
  'c-3.2': [
    'leg_curl_lying_matrix',
    'leg_curl_lying_technogym',
    'leg_curl_seated_matrix',
    'leg_curl_seated_technogym',
    'seated_leg_curl_alt_matrix',
    'seated_leg_curl_alt_technogym',
    'rdl_dumbbells',
  ],
  // 12. Разгибания: блок → рычаг
  'l-3.1': [
    'leg_extension_matrix',
    'leg_extension_technogym',
    'leg_extension_lever_matrix',
    'leg_extension_lever_technogym',
  ],
  // 8. Бицепс: рычаг/Скотт блины → EZ → гантели → блок
  'b-3.2': [
    'biceps_machine_technogym',
    'preacher_curl_technogym',
    'preacher_curl_matrix',
    'biceps_machine_matrix',
    'biceps_ez_bar',
    'biceps_dumbbells_incline',
    'cable_curl_matrix',
    'cable_curl_technogym',
  ],
  // 8. Задняя дельта день B: Face Pull → обратная бабочка
  'b-2.4': [
    'face_pull_matrix_b',
    'face_pull_technogym_b',
    'reverse_pec_deck_matrix_b',
    'reverse_pec_deck_technogym_b',
  ],
  // 14. День C задняя дельта: сначала обратная бабочка
  'c-4.2': [
    'reverse_pec_deck_matrix_b',
    'reverse_pec_deck_technogym_b',
    'face_pull_matrix_b',
    'face_pull_technogym_b',
  ],
  // 9. Средняя дельта день B: рычажный жим → гантели → блок
  'b-3.3': [
    'shoulder_press_lever_matrix_b',
    'shoulder_press_lever_technogym_b',
    'dumbbell_shoulder_press_b',
    'shoulder_press_matrix_b',
    'shoulder_press_technogym_b',
    'crossover_lateral_raise_matrix_b',
    'crossover_lateral_raise_technogym_b',
  ],
  // 10. Брусья: гравитрон → свой вес → рычаг
  'a-3.1': [
    'dips_gravitron_lower_matrix',
    'dips_gravitron_lower_technogym',
    'dips_lower_chest_bodyweight',
    'dips_lever_matrix',
    'dips_lever_technogym',
    'hammer_lower_chest_matrix',
    'hammer_lower_chest_technogym',
    'chest_press_matrix',
    'chest_press_technogym',
    'decline_smith_matrix',
    'decline_smith_technogym',
  ],
  'b-5.2': [
    'tricep_rope_matrix',
    'tricep_rope_technogym',
    'tricep_pushdown_bar_matrix',
    'tricep_pushdown_bar_technogym',
  ],
};

function sortByPriority(exerciseId: string, options: MachineOption[]): MachineOption[] {
  const order = VARIANT_PRIORITY[exerciseId];
  if (!order?.length) return options;
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...options].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id)! : 1000;
    const rb = rank.has(b.id) ? rank.get(b.id)! : 1000;
    return ra - rb;
  });
}

export function getOptionsForExercise(
  exerciseId: string,
  gymBrand?: string
): MachineOption[] {
  const resolvedId = EXERCISE_ID_ALIASES[exerciseId] || exerciseId;
  let options = MACHINE_OPTIONS.filter(
    opt => opt.exerciseId === resolvedId || opt.exerciseId === exerciseId,
  );

  if (gymBrand && gymBrand !== 'other') {
    const filtered = options.filter(
      opt => opt.brand === 'free_weight' || opt.brand === 'both' || opt.brand === gymBrand,
    );
    if (filtered.length > 0) options = filtered;
  }

  return sortByPriority(exerciseId, options);
}

/** Normalize machine labels so renamed variants still match history. */
export function normalizeMachineKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/technogym|matrix|свободный вес|фото/gi, ' ')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function machinesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalizeMachineKey(a);
  const nb = normalizeMachineKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = na.split(' ').filter(t => t.length > 2);
  const tb = new Set(nb.split(' ').filter(t => t.length > 2));
  const overlap = ta.filter(t => tb.has(t));
  // Face Pull / скотта / рычажный etc.
  return overlap.length >= 2 || (overlap.length >= 1 && (na.length < 18 || nb.length < 18));
}

/** Map a historical machine name onto the current option list. */
export function resolveOptionByHistoricalName(
  options: MachineOption[],
  historicalName?: string | null,
): MachineOption | undefined {
  if (!historicalName || !options.length) return undefined;
  const exact = options.find(o => o.name === historicalName);
  if (exact) return exact;
  return options.find(o => machinesMatch(o.name, historicalName));
}

export function isBlockMachineOption(machineName?: string): boolean {
  if (!machineName) return false;
  const match =
    MACHINE_OPTIONS.find(opt => opt.name === machineName) ||
    MACHINE_OPTIONS.find(opt => machinesMatch(opt.name, machineName));
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

export function getMachineOption(machineName?: string): MachineOption | undefined {
  if (!machineName) return undefined;
  return (
    MACHINE_OPTIONS.find(opt => opt.name === machineName) ||
    MACHINE_OPTIONS.find(opt => machinesMatch(opt.name, machineName))
  );
}

export function isAssistedMachine(machineName?: string): boolean {
  if (!machineName) return false;
  const match = getMachineOption(machineName);
  if (match?.isAssisted) return true;
  return machineName.toLowerCase().includes('гравитрон');
}

export function getMachineBaseTareWeight(machineName?: string): number {
  if (!machineName) return 0;
  const match = MACHINE_OPTIONS.find(opt => opt.name === machineName);
  return match?.baseTareWeight || 0;
}

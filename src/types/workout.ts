export type GymBrand = 'matrix' | 'technogym' | 'other';

export interface Gym {
  id: string;
  name: string;
  brand: GymBrand;
  notes?: string;
  isDefault?: boolean;
}

export interface MachineEquipment {
  id: string;
  gymId: string; // link to Gym
  exerciseId: string; // e.g. 'a-1.1' or custom
  machineName: string; // e.g., "Leg Press Matrix #2" or "Smith Machine Technogym"
  emptyWeightKg: number; // e.g., Smith machine bar empty weight (Matrix 11kg vs Technogym 5kg)
  ratioMultiplier: number; // e.g., Cable crossover ratio (1.0, 0.5, etc.) or note scale
  notes?: string; // e.g., "Black pin, top notch"
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  effectiveWeightKg?: number;
  reps: number;
  completed: boolean;
  notes?: string;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseTitle: string;
  muscleGroup: string;
  machineId?: string;
  machineName?: string;
  gymId?: string;
  gymName?: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface LoggedSuperset {
  supersetId: string;
  supersetTitle: string;
  restIntervalSec1: number;
  restIntervalSec2: number;
  exercises: LoggedExercise[];
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss.sssZ
  workoutType: 'A' | 'B';
  dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  gymId?: string;
  gymName?: string;
  durationMinutes?: number;
  supersets: LoggedSuperset[];
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ExerciseDefinition {
  id: string;
  supersetId: string;
  code: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  focusNotes: string;
}

export interface SupersetDefinition {
  id: string;
  number: number;
  title: string;
  rest1Text: string;
  rest1Sec: number;
  rest2Text: string;
  rest2Sec: number;
  exercises: ExerciseDefinition[];
}

export interface ProgramWorkout {
  type: 'A' | 'B';
  title: string;
  subTitle: string;
  supersets: SupersetDefinition[];
}

// InBody Body Composition Metrics
export interface InBodyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number; // Общий вес
  muscleMassKg?: number; // Скелетно-мышечная масса (SMM)
  fatMassKg?: number; // Масса жира (BFM)
  bodyFatPercent?: number; // Процент жира (PBF)
  bmi?: number; // Индекс массы тела
  imageUrl?: string; // Data URL or object URL of InBody report scan
  notes?: string;
}

// Progress Photo Records
export type PhotoPose = 'front' | 'side' | 'back' | 'biceps';

export interface ProgressPhotoRecord {
  id: string;
  date: string; // YYYY-MM-DD
  pose: PhotoPose;
  imageUrl: string;
  weightKg?: number;
  notes?: string;
}

export interface ActiveWorkoutDraft {
  workoutType: 'A' | 'B';
  dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
  gymId: string;
  session: WorkoutSession;
  elapsedSeconds: number;
  lastUpdatedTimestamp: number;
  activeSupersetIndex: number;
}

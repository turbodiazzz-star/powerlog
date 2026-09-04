import type { Gym, MachineEquipment, WorkoutSession, InBodyRecord, ProgressPhotoRecord } from '../types/workout';
import { INITIAL_GYMS } from '../data/workoutProgram';

const STORAGE_KEYS = {
  GYMS: 'fit_tracker_gyms_v1',
  MACHINES: 'fit_tracker_machines_v1',
  SESSIONS: 'fit_tracker_sessions_v1',
  SELECTED_GYM: 'fit_tracker_selected_gym_v1',
  INBODY: 'fit_tracker_inbody_v1',
  PHOTOS: 'fit_tracker_photos_v1',
};

export class StorageService {
  // Gyms
  static getGyms(): Gym[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GYMS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(INITIAL_GYMS));
        return INITIAL_GYMS;
      }
      const gyms: Gym[] = JSON.parse(data);
      return gyms.map(g => ({
        ...g,
        name: g.name.replace(/\s*\([^)]*Смит[^)]*\)/gi, '').trim(),
      }));
    } catch {
      return INITIAL_GYMS;
    }
  }

  static saveGyms(gyms: Gym[]): void {
    localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(gyms));
  }

  static addGym(gym: Omit<Gym, 'id'>): Gym {
    const gyms = this.getGyms();
    const newGym: Gym = {
      ...gym,
      id: 'gym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    gyms.push(newGym);
    this.saveGyms(gyms);
    return newGym;
  }

  static updateGym(gym: Gym): void {
    const gyms = this.getGyms().map(g => (g.id === gym.id ? gym : g));
    this.saveGyms(gyms);
  }

  static deleteGym(gymId: string): void {
    const gyms = this.getGyms().filter(g => g.id !== gymId);
    this.saveGyms(gyms);
  }

  static getSelectedGymId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.SELECTED_GYM);
    if (id) return id;
    const gyms = this.getGyms();
    return gyms[0]?.id || '';
  }

  static setSelectedGymId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_GYM, id);
  }

  // Machines / Equipment
  static getMachines(): MachineEquipment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MACHINES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveMachines(machines: MachineEquipment[]): void {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
  }

  static saveMachine(machine: Omit<MachineEquipment, 'id'> & { id?: string }): MachineEquipment {
    const machines = this.getMachines();
    let saved: MachineEquipment;
    if (machine.id) {
      saved = machine as MachineEquipment;
      const index = machines.findIndex(m => m.id === machine.id);
      if (index !== -1) {
        machines[index] = saved;
      } else {
        machines.push(saved);
      }
    } else {
      saved = {
        ...machine,
        id: 'mac_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      };
      machines.push(saved);
    }
    this.saveMachines(machines);
    return saved;
  }

  static getMachinesForGymAndExercise(gymId: string, exerciseId: string): MachineEquipment[] {
    const machines = this.getMachines();
    return machines.filter(m => m.gymId === gymId && m.exerciseId === exerciseId);
  }

  // Sessions
  static getSessions(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: WorkoutSession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  static saveSession(session: WorkoutSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.saveSessions(sessions);
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter(s => s.id !== sessionId);
    this.saveSessions(sessions);
  }

  static getLastExerciseLog(
    exerciseId: string,
    _gymId?: string,
    machineId?: string,
    variantName?: string
  ): {
    sessionDate: string;
    gymName?: string;
    machineName?: string;
    sets: { weightKg: number; reps: number; notes?: string }[];
  } | null {
    const sessions = this.getSessions()
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. First search for matching variantName if provided
    if (variantName) {
      for (const session of sessions) {
        for (const superset of session.supersets) {
          for (const ex of superset.exercises) {
            if (ex.exerciseId === exerciseId && ex.machineName === variantName) {
              const validSets = ex.sets.filter(s => s.completed && s.reps > 0);
              if (validSets.length > 0) {
                return {
                  sessionDate: session.date,
                  gymName: ex.gymName || session.gymName,
                  machineName: ex.machineName,
                  sets: validSets.map(s => ({ weightKg: s.weightKg, reps: s.reps, notes: s.notes })),
                };
              }
            }
          }
        }
      }
    }

    // 2. Fallback to general last log for this exercise
    for (const session of sessions) {
      for (const superset of session.supersets) {
        for (const ex of superset.exercises) {
          if (ex.exerciseId === exerciseId) {
            if (machineId && ex.machineId !== machineId) continue;
            const validSets = ex.sets.filter(s => s.completed && s.reps > 0);
            if (validSets.length > 0) {
              return {
                sessionDate: session.date,
                gymName: ex.gymName || session.gymName,
                machineName: ex.machineName,
                sets: validSets.map(s => ({ weightKg: s.weightKg, reps: s.reps, notes: s.notes })),
              };
            }
          }
        }
      }
    }
    return null;
  }

  static getPreviousVariantUsed(exerciseId: string): string | null {
    const sessions = this.getSessions()
      .filter(s => s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const session of sessions) {
      for (const superset of session.supersets) {
        for (const ex of superset.exercises) {
          if (ex.exerciseId === exerciseId && ex.machineName) {
            return ex.machineName;
          }
        }
      }
    }
    return null;
  }

  static getNextWorkoutRecommendation(): {
    workoutType: 'A' | 'B';
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
    completedCount: number;
    lastDate?: string;
  } {
    const sessions = this.getSessions()
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalCount = sessions.length;
    const lastSession = sessions[sessions.length - 1];

    const nextType: 'A' | 'B' = lastSession ? (lastSession.workoutType === 'A' ? 'B' : 'A') : 'A';
    const dayNames: Array<'Пн' | 'Ср' | 'Пт'> = ['Пн', 'Ср', 'Пт'];
    const nextDay = dayNames[totalCount % 3];

    return {
      workoutType: nextType,
      dayName: nextDay,
      completedCount: totalCount,
      lastDate: lastSession ? lastSession.date : undefined,
    };
  }

  // InBody Records
  static getInBodyRecords(): InBodyRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INBODY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveInBodyRecord(record: Omit<InBodyRecord, 'id'> & { id?: string }): InBodyRecord {
    const records = this.getInBodyRecords();
    let saved: InBodyRecord;
    if (record.id) {
      saved = record as InBodyRecord;
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) records[index] = saved;
      else records.push(saved);
    } else {
      saved = {
        ...record,
        id: 'inbody_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      };
      records.push(saved);
    }
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(STORAGE_KEYS.INBODY, JSON.stringify(records));
    return saved;
  }

  static deleteInBodyRecord(id: string): void {
    const records = this.getInBodyRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.INBODY, JSON.stringify(records));
  }

  // Progress Photos
  static getProgressPhotos(): ProgressPhotoRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveProgressPhoto(photo: Omit<ProgressPhotoRecord, 'id'> & { id?: string }): ProgressPhotoRecord {
    const photos = this.getProgressPhotos();
    let saved: ProgressPhotoRecord;
    if (photo.id) {
      saved = photo as ProgressPhotoRecord;
      const idx = photos.findIndex(p => p.id === photo.id);
      if (idx !== -1) photos[idx] = saved;
      else photos.push(saved);
    } else {
      saved = {
        ...photo,
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      };
      photos.push(saved);
    }
    photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    return saved;
  }

  static deleteProgressPhoto(id: string): void {
    const photos = this.getProgressPhotos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  }

  // Backup / Export
  static exportData(): string {
    const data = {
      gyms: this.getGyms(),
      machines: this.getMachines(),
      sessions: this.getSessions(),
      inbody: this.getInBodyRecords(),
      photos: this.getProgressPhotos(),
      exportDate: new Date().toISOString(),
      version: 2,
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.gyms)) this.saveGyms(data.gyms);
      if (Array.isArray(data.machines)) this.saveMachines(data.machines);
      if (Array.isArray(data.sessions)) this.saveSessions(data.sessions);
      if (Array.isArray(data.inbody)) localStorage.setItem(STORAGE_KEYS.INBODY, JSON.stringify(data.inbody));
      if (Array.isArray(data.photos)) localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(data.photos));
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

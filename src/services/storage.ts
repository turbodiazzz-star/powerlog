import type { Gym, MachineEquipment, WorkoutSession, InBodyRecord, ProgressPhotoRecord, ActiveWorkoutDraft, ProgramWorkout } from '../types/workout';
import { INITIAL_GYMS, getWorkoutProgram } from '../data/workoutProgram';
import type { BodyGender, BodyProfile } from '../utils/inBodyNorms';

const STORAGE_KEYS = {
  GYMS: 'fit_tracker_gyms_v1',
  MACHINES: 'fit_tracker_machines_v1',
  SESSIONS: 'fit_tracker_sessions_v1',
  SELECTED_GYM: 'fit_tracker_selected_gym_v1',
  INBODY: 'fit_tracker_inbody_v1',
  PHOTOS: 'fit_tracker_photos_v1',
  ACTIVE_DRAFT: 'fit_tracker_active_draft_v2',
  PROFILE: 'fit_tracker_body_profile_v1',
  PROGRAM: 'fit_tracker_program_v1',
  DELETED_INBODY: 'fit_tracker_deleted_inbody_v1',
  DELETED_PHOTOS: 'fit_tracker_deleted_photos_v1',
  DELETED_SESSIONS: 'fit_tracker_deleted_sessions_v1',
  DELETED_GYMS: 'fit_tracker_deleted_gyms_v1',
  DELETED_MACHINES: 'fit_tracker_deleted_machines_v1',
};

export class StorageService {
  static getCustomProgram(): Record<string, ProgramWorkout> | null {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRAM) || 'null'); return value && typeof value === 'object' ? value : null; } catch { return null; }
  }

  static saveCustomProgram(program: Record<string, ProgramWorkout>, silent = false): void {
    localStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(program));
    localStorage.setItem('fit_tracker_program_schema_v2', '1');
    if (!silent) StorageService.touchCloud();
  }
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

  static saveGyms(gyms: Gym[], silent = false): void {
    localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(gyms));
    if (!silent) StorageService.touchCloud();
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
    localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(gyms));
    this.markDeleted(STORAGE_KEYS.DELETED_GYMS, gymId);
    StorageService.touchCloud();
  }

  static getSelectedGymId(): string {
    if (!localStorage.getItem('fit_tracker_default_technogym_v1')) {
      const technogym = this.getGyms().find(g => g.brand === 'technogym');
      if (technogym) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_GYM, technogym.id);
        localStorage.setItem('fit_tracker_default_technogym_v1', '1');
        return technogym.id;
      }
    }
    const id = localStorage.getItem(STORAGE_KEYS.SELECTED_GYM);
    if (id) return id;
    const gyms = this.getGyms();
    return gyms[0]?.id || '';
  }

  static setSelectedGymId(id: string, silent = false): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_GYM, id);
    if (!silent) StorageService.touchCloud();
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

  static saveMachines(machines: MachineEquipment[], silent = false): void {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    if (!silent) StorageService.touchCloud();
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

  static deleteMachine(machineId: string): void {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(this.getMachines().filter(machine => machine.id !== machineId)));
    this.markDeleted(STORAGE_KEYS.DELETED_MACHINES, machineId);
    StorageService.touchCloud();
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

  static saveSessions(sessions: WorkoutSession[], silent = false): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    if (!silent) StorageService.touchCloud();
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
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this.markDeleted(STORAGE_KEYS.DELETED_SESSIONS, sessionId);
    StorageService.touchCloud();
  }

  static hasLoggedSets(session: WorkoutSession): boolean {
    return session.supersets.some(ss =>
      ss.exercises.some(ex => ex.sets.some(s =>
        s.completed || (s.weightConfirmed === true && s.repsConfirmed === true && s.weightKg > 0 && s.reps > 0)
      ))
    );
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
      .filter(s => s.completed || this.hasLoggedSets(s))
      .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime());

    // 1. First search for matching variantName if provided
    if (variantName) {
      for (const session of sessions) {
        for (const superset of session.supersets) {
          for (const ex of superset.exercises) {
            if (ex.exerciseId === exerciseId && ex.machineName === variantName) {
              const validSets = ex.sets.filter(s => (s.completed || s.weightKg > 0) && s.reps > 0);
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
            const validSets = ex.sets.filter(s => (s.completed || s.weightKg > 0) && s.reps > 0);
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

  static getPenultimateVariantUsed(exerciseId: string): string | null {
    const sessions = this.getSessions()
      .filter(s => s.completed || this.hasLoggedSets(s))
      .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime());

    const names: string[] = [];
    for (const session of sessions) {
      let found: string | null = null;
      for (const superset of session.supersets) {
        for (const ex of superset.exercises) {
          if (ex.exerciseId === exerciseId && ex.machineName) {
            found = ex.machineName;
          }
        }
      }
      if (found && names[names.length - 1] !== found) {
        names.push(found);
      }
    }
    return names[1] || names[0] || null;
  }

  static getLatestBodyWeightKg(): number {
    const recs = this.getInBodyRecords();
    return recs[0]?.weightKg || 0;
  }

  static getPreviousVariantUsed(exerciseId: string): string | null {
    return this.getPenultimateVariantUsed(exerciseId);
  }

  static getNextWorkoutRecommendation(): {
    workoutType: string;
    dayName: 'Пн' | 'Ср' | 'Пт' | 'Доп';
    completedCount: number;
    lastDate?: string;
  } {
    const sessions = this.getSessions()
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.completedAt || a.date).getTime() - new Date(b.completedAt || b.date).getTime());

    const totalCount = sessions.length;
    const lastSession = sessions[sessions.length - 1];

    const workoutTypes = Object.keys(getWorkoutProgram());
    const lastIndex = lastSession ? workoutTypes.indexOf(lastSession.workoutType) : -1;
    const nextType = workoutTypes[(lastIndex + 1 + workoutTypes.length) % workoutTypes.length] || 'A';
    const dayNames: Array<'Пн' | 'Ср' | 'Пт'> = ['Пн', 'Ср', 'Пт'];
    const nextDay = dayNames[totalCount % 3];

    return {
      workoutType: nextType,
      dayName: nextDay,
      completedCount: totalCount,
      lastDate: lastSession ? lastSession.date : undefined,
    };
  }

  // Active Draft Session (Auto-save current weights, reps, timer state)
  static getActiveDraft(workoutType?: string): ActiveWorkoutDraft | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
      if (!data) return null;
      const draft: ActiveWorkoutDraft = JSON.parse(data);
      if (workoutType && draft.workoutType !== workoutType) {
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }

  static saveActiveDraft(draft: ActiveWorkoutDraft): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draft));
      StorageService.touchCloud();
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }

  static clearActiveDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
    StorageService.touchCloud();
  }

  static getInBodyRecords(): InBodyRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INBODY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static replaceInBodyRecords(records: InBodyRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.INBODY, JSON.stringify(records));
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
    StorageService.touchCloud();
    return saved;
  }

  static deleteInBodyRecord(id: string): void {
    const records = this.getInBodyRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.INBODY, JSON.stringify(records));
    const deleted = this.getDeletedIds(STORAGE_KEYS.DELETED_INBODY); deleted.add(id);
    localStorage.setItem(STORAGE_KEYS.DELETED_INBODY, JSON.stringify([...deleted]));
    StorageService.touchCloud();
  }

  static getProgressPhotos(): ProgressPhotoRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static replaceProgressPhotos(photos: ProgressPhotoRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
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
    StorageService.touchCloud();
    return saved;
  }

  static deleteProgressPhoto(id: string): void {
    const photos = this.getProgressPhotos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    const deleted = this.getDeletedIds(STORAGE_KEYS.DELETED_PHOTOS); deleted.add(id);
    localStorage.setItem(STORAGE_KEYS.DELETED_PHOTOS, JSON.stringify([...deleted]));
    StorageService.touchCloud();
  }

  private static getDeletedIds(key: string): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
  }

  private static markDeleted(key: string, id: string): void {
    const deleted = this.getDeletedIds(key);
    deleted.add(id);
    localStorage.setItem(key, JSON.stringify([...deleted]));
  }

  static getBodyProfile(): BodyProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data) as BodyProfile;
        return {
          gender: parsed.gender === 'female' ? 'female' : 'male',
          heightCm: parsed.heightCm,
        };
      }
    } catch {
      // ignore
    }
    return { gender: 'male' };
  }

  static saveBodyProfile(profile: BodyProfile, silent = false): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    if (!silent) StorageService.touchCloud();
  }

  static touchCloud() {
    void import('./cloudSync').then(({ CloudSync }) => CloudSync.schedulePush());
  }

  static setBodyGender(gender: BodyGender): void {
    const current = this.getBodyProfile();
    this.saveBodyProfile({ ...current, gender });
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
      if (Array.isArray(data.inbody)) this.replaceInBodyRecords(data.inbody);
      if (Array.isArray(data.photos)) this.replaceProgressPhotos(data.photos);
      StorageService.touchCloud();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

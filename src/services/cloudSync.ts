import { StorageService } from './storage';
import { AiService } from './aiService';

export interface CloudSnapshot {
  version: number;
  updatedAt: string;
  gyms: unknown[];
  machines: unknown[];
  sessions: unknown[];
  inbody: unknown[];
  photos: unknown[];
  selectedGymId?: string;
  profile?: unknown;
  draft?: unknown;
  aiReports?: unknown[];
  deletedInbodyIds?: string[];
  deletedPhotoIds?: string[];
  program?: unknown;
}

const WORKER_URL = 'https://powerlog-cloud.powerlog-worker.workers.dev';
const PENDING_KEY = 'fit_tracker_cloud_pending_v1';
const SESSION_KEY = 'fit_tracker_cloud_session_v1';

export type CloudStatus = 'disconnected' | 'syncing' | 'saved' | 'retrying';

function emitStatus(status: CloudStatus) {
  window.dispatchEvent(new CustomEvent<CloudStatus>('powerlog:cloud-status', { detail: status }));
}

function authHeaders(): Record<string, string> {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? { Authorization: `Bearer ${session}` } : {};
}

function byId<T extends { id?: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item?.id) map.set(item.id, item);
  }
  return map;
}

function mergeById<T extends { id?: string }>(local: T[], remote: T[]): T[] {
  const map = byId(local);
  for (const item of remote) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    // Keep the local copy as the authoritative edited record, but fill gaps
    // from the cloud. This is especially important for imageUrl: an older
    // browser can have the same record id without the image while the cloud
    // copy already contains the uploaded scan/photo.
    const merged = { ...item, ...existing } as T & { imageUrl?: string };
    const remoteImage = (item as T & { imageUrl?: string }).imageUrl;
    if (!merged.imageUrl && remoteImage) merged.imageUrl = remoteImage;
    map.set(item.id, merged as T);
  }
  return Array.from(map.values());
}

function countRecords(snap: CloudSnapshot | null | undefined): number {
  if (!snap) return 0;
  // Treat every persisted collection as cloud-worthy. Previously a profile,
  // gym, or machine change could stay only in localStorage until a workout or
  // InBody record happened to exist.
  return (
    (snap.gyms?.length || 0) +
    (snap.machines?.length || 0) +
    (snap.sessions?.length || 0) +
    (snap.inbody?.length || 0) +
    (snap.photos?.length || 0) +
    (snap.aiReports?.length || 0) +
    (snap.profile ? 1 : 0) +
    (snap.draft ? 1 : 0) +
    (snap.program ? 1 : 0)
  );
}

function compactForGit(snap: CloudSnapshot): CloudSnapshot {
  return {
    ...snap,
    version: 4,
    updatedAt: new Date().toISOString(),
    // Keep private image data in the private repository so every browser
    // receives the complete InBody and progress-photo history.
    photos: snap.photos || [],
    inbody: snap.inbody || [],
  };
}

export class CloudSync {
  private static pushTimer: ReturnType<typeof setTimeout> | null = null;
  private static pushing = false;
  private static queued = false;
  private static hydrating = false;
  private static connected = false;

  static captureLocal(): CloudSnapshot {
    let aiReports: unknown[] = [];
    try {
      aiReports = AiService.getSavedReports();
    } catch {
      aiReports = [];
    }
    return {
      version: 4,
      updatedAt: new Date().toISOString(),
      gyms: StorageService.getGyms(),
      machines: StorageService.getMachines(),
      sessions: StorageService.getSessions(),
      inbody: StorageService.getInBodyRecords(),
      photos: StorageService.getProgressPhotos(),
      deletedInbodyIds: JSON.parse(localStorage.getItem('fit_tracker_deleted_inbody_v1') || '[]'),
      deletedPhotoIds: JSON.parse(localStorage.getItem('fit_tracker_deleted_photos_v1') || '[]'),
      selectedGymId: StorageService.getSelectedGymId(),
      profile: StorageService.getBodyProfile(),
      draft: StorageService.getActiveDraft(),
      aiReports,
      program: StorageService.getCustomProgram(),
    };
  }

  static applySnapshot(snap: CloudSnapshot) {
    if (Array.isArray(snap.deletedInbodyIds)) localStorage.setItem('fit_tracker_deleted_inbody_v1', JSON.stringify(snap.deletedInbodyIds));
    if (Array.isArray(snap.deletedPhotoIds)) localStorage.setItem('fit_tracker_deleted_photos_v1', JSON.stringify(snap.deletedPhotoIds));
    if (Array.isArray(snap.gyms) && snap.gyms.length) StorageService.saveGyms(snap.gyms as never, true);
    if (Array.isArray(snap.machines)) StorageService.saveMachines(snap.machines as never, true);
    if (Array.isArray(snap.sessions)) StorageService.saveSessions(snap.sessions as never, true);
    if (Array.isArray(snap.inbody)) StorageService.replaceInBodyRecords(snap.inbody as never);
    if (Array.isArray(snap.photos)) StorageService.replaceProgressPhotos(snap.photos as never);
    if (snap.selectedGymId) StorageService.setSelectedGymId(snap.selectedGymId, true);
    if (snap.profile) StorageService.saveBodyProfile(snap.profile as never, true);
    if (snap.program && typeof snap.program === 'object') StorageService.saveCustomProgram(snap.program as never, true);
    if (Array.isArray(snap.aiReports)) {
      localStorage.setItem('fit_tracker_ai_reports_v1', JSON.stringify(snap.aiReports));
    }
  }

  static mergeSnapshots(local: CloudSnapshot, remote: CloudSnapshot): CloudSnapshot {
    const deletedInbodyIds = [...new Set([...(local.deletedInbodyIds || []), ...(remote.deletedInbodyIds || [])])];
    const deletedPhotoIds = [...new Set([...(local.deletedPhotoIds || []), ...(remote.deletedPhotoIds || [])])];
    return {
      version: 4,
      updatedAt: new Date().toISOString(),
      gyms: mergeById(local.gyms as never, remote.gyms as never),
      machines: mergeById(local.machines as never, remote.machines as never),
      sessions: mergeById(local.sessions as never, remote.sessions as never),
      photos: mergeById(local.photos as never, remote.photos as never).filter((item: any) => !deletedPhotoIds.includes(item.id)),
      inbody: mergeById(local.inbody as never, remote.inbody as never).filter((item: any) => !deletedInbodyIds.includes(item.id)),
      selectedGymId: local.selectedGymId || remote.selectedGymId,
      profile: local.profile || remote.profile,
      draft: local.draft || remote.draft,
      aiReports: mergeById((local.aiReports as never) || [], (remote.aiReports as never) || []),
      program: local.program || remote.program,
      deletedInbodyIds,
      deletedPhotoIds,
    };
  }

  static async pullRemote(): Promise<CloudSnapshot | null> {
    try {
      const res = await fetch(`${WORKER_URL}/state`, { credentials: 'include', cache: 'no-store', headers: authHeaders() });
      if (res.status === 401) { this.connected = false; return null; }
      if (!res.ok) return null;
      this.connected = true;
      const json = await res.json();
      if (!json || typeof json !== 'object') return null;
      return json as CloudSnapshot;
    } catch {
      return null;
    }
  }

  static async pushSnapshot(snap: CloudSnapshot): Promise<boolean> {
    const compact = compactForGit(snap);
    try {
      const res = await fetch(`${WORKER_URL}/state`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(compact) });
      this.connected = res.ok;
      return res.ok;
    } catch {
      return false;
    }
  }

  static async hydrate(): Promise<void> {
    if (this.hydrating) return;
    this.hydrating = true;
    emitStatus('syncing');
    try {
      const local = this.captureLocal();
      const remote = await this.pullRemote();
      if (remote && countRecords(remote) > 0) {
        this.applySnapshot(this.mergeSnapshots(local, remote));
      }
      const after = this.captureLocal();
      if (countRecords(after) > 0) {
        const saved = await this.pushSnapshot(after);
        emitStatus(saved ? 'saved' : 'retrying');
      } else {
        emitStatus('saved');
      }
    } finally {
      this.hydrating = false;
    }
  }

  static schedulePush() {
    // Every user change is queued immediately. The queue serializes GitHub
    // commits, so a page refresh cannot drop a completed workout while a
    // five-second debounce is still waiting.
    this.queued = true;
    localStorage.setItem(PENDING_KEY, '1');
    emitStatus('syncing');
    if (this.pushing || this.pushTimer) return;
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.flushPushQueue();
    }, 0);
  }

  private static async flushPushQueue(): Promise<void> {
    if (this.pushing) return;
    this.pushing = true;
    try {
      while (this.queued) {
        this.queued = false;
        const snap = this.captureLocal();
        if (countRecords(snap) === 0 && !snap.draft) continue;
        const saved = await this.pushSnapshot(snap);
        if (!saved) {
          this.queued = true;
          emitStatus('retrying');
          // Keep a visible durable marker and retry without requiring another edit.
          this.pushTimer = setTimeout(() => { this.pushTimer = null; void this.flushPushQueue(); }, 10000);
          return;
        }
      }
      localStorage.removeItem(PENDING_KEY);
      emitStatus('saved');
    } finally {
      this.pushing = false;
    }
  }

  static isConnected(): boolean {
    return this.connected || Boolean(localStorage.getItem(SESSION_KEY));
  }

  static async startDeviceAuthorization(): Promise<{ userCode: string; verificationUri: string; deviceCode: string; interval: number }> {
    const response = await fetch(`${WORKER_URL}/auth/start`, { method: 'POST', credentials: 'include' });
    const data = await response.json();
    if (!response.ok || !data.deviceCode || !data.userCode || !data.verificationUri) {
      throw new Error(data.error_description || 'Не удалось начать вход в GitHub');
    }
    return { userCode: data.userCode, verificationUri: data.verificationUri, deviceCode: data.deviceCode, interval: Math.max(5, Number(data.interval) || 5) };
  }

  static async finishDeviceAuthorization(deviceCode: string): Promise<'pending' | 'connected'> {
    const response = await fetch(`${WORKER_URL}/auth/poll`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceCode }) });
    const data = await response.json();
    if (data.status === 'connected') {
      if (data.session) localStorage.setItem(SESSION_KEY, data.session);
      this.connected = true;
      emitStatus('syncing');
      await this.hydrate();
      return 'connected';
    }
    if (data.error === 'authorization_pending' || data.error === 'slow_down') return 'pending';
    throw new Error(data.error_description || 'Авторизация GitHub не завершилась');
  }
}

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
}

const OWNER = 'turbodiazzz-star';
const REPO = 'powerlog';
const RAW_STATE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/cloud/state.json`;
const API = 'https://api.github.com';

declare const __PWR__: number[];

function writeToken(): string {
  try {
    const nums = typeof __PWR__ === 'undefined' ? [] : __PWR__;
    if (!nums.length) return '';
    return nums.map(n => String.fromCharCode(n ^ 91)).join('');
  } catch {
    return '';
  }
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
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function countRecords(snap: CloudSnapshot | null | undefined): number {
  if (!snap) return 0;
  return (snap.sessions?.length || 0) + (snap.inbody?.length || 0) + (snap.photos?.length || 0);
}

function csvEscape(value: unknown) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  return (
    [headers.join(',')]
      .concat(rows.map(row => headers.map(h => csvEscape(row[h])).join(',')))
      .join('\n') + '\n'
  );
}

function compactForGit(snap: CloudSnapshot): CloudSnapshot {
  const strip = (items: unknown[]) =>
    (items || []).map((item: any) => {
      const url = String(item?.imageUrl || '');
      if (url.startsWith('http')) return item;
      const { imageUrl, ...rest } = item || {};
      return rest;
    });
  return {
    ...snap,
    version: 4,
    updatedAt: new Date().toISOString(),
    photos: strip(snap.photos),
    inbody: strip(snap.inbody),
  };
}

async function gh(path: string, init: RequestInit = {}) {
  const token = writeToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `GitHub HTTP ${res.status}`);
  return json;
}

function tableFiles(snap: CloudSnapshot): { path: string; content: string }[] {
  const sessions = (snap.sessions || []) as any[];
  const inbody = (snap.inbody || []) as any[];
  const photos = (snap.photos || []) as any[];
  const gyms = (snap.gyms || []) as any[];
  const machines = (snap.machines || []) as any[];
  return [
    { path: 'cloud/state.json', content: JSON.stringify(snap, null, 2) },
    {
      path: 'cloud/tables/sessions.csv',
      content: toCsv(
        sessions.map(s => ({
          id: s.id,
          date: s.date,
          workoutType: s.workoutType,
          dayName: s.dayName,
          gymName: s.gymName,
          durationMinutes: s.durationMinutes,
          completed: s.completed,
        })),
        ['id', 'date', 'workoutType', 'dayName', 'gymName', 'durationMinutes', 'completed'],
      ),
    },
    {
      path: 'cloud/tables/inbody.csv',
      content: toCsv(
        inbody.map(r => ({
          id: r.id,
          date: r.date,
          weightKg: r.weightKg,
          muscleMassKg: r.muscleMassKg,
          fatMassKg: r.fatMassKg,
          bodyFatPercent: r.bodyFatPercent,
          scan: r.imageUrl,
        })),
        ['id', 'date', 'weightKg', 'muscleMassKg', 'fatMassKg', 'bodyFatPercent', 'scan'],
      ),
    },
    {
      path: 'cloud/tables/photos.csv',
      content: toCsv(
        photos.map(p => ({
          id: p.id,
          date: p.date,
          pose: p.pose,
          weightKg: p.weightKg,
          image: p.imageUrl,
        })),
        ['id', 'date', 'pose', 'weightKg', 'image'],
      ),
    },
    {
      path: 'cloud/tables/gyms.csv',
      content: toCsv(
        gyms.map(g => ({ id: g.id, name: g.name, brand: g.brand, notes: g.notes })),
        ['id', 'name', 'brand', 'notes'],
      ),
    },
    {
      path: 'cloud/tables/machines.csv',
      content: toCsv(
        machines.map(m => ({
          id: m.id,
          gymId: m.gymId,
          exerciseId: m.exerciseId,
          machineName: m.machineName,
          emptyWeightKg: m.emptyWeightKg,
          ratioMultiplier: m.ratioMultiplier,
        })),
        ['id', 'gymId', 'exerciseId', 'machineName', 'emptyWeightKg', 'ratioMultiplier'],
      ),
    },
  ];
}

export class CloudSync {
  private static pushTimer: ReturnType<typeof setTimeout> | null = null;
  private static hydrating = false;

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
      selectedGymId: StorageService.getSelectedGymId(),
      profile: StorageService.getBodyProfile(),
      draft: StorageService.getActiveDraft(),
      aiReports,
    };
  }

  static applySnapshot(snap: CloudSnapshot) {
    if (Array.isArray(snap.gyms) && snap.gyms.length) StorageService.saveGyms(snap.gyms as never, true);
    if (Array.isArray(snap.machines)) StorageService.saveMachines(snap.machines as never, true);
    if (Array.isArray(snap.sessions)) StorageService.saveSessions(snap.sessions as never, true);
    if (Array.isArray(snap.inbody)) StorageService.replaceInBodyRecords(snap.inbody as never);
    if (Array.isArray(snap.photos)) StorageService.replaceProgressPhotos(snap.photos as never);
    if (snap.selectedGymId) StorageService.setSelectedGymId(snap.selectedGymId, true);
    if (snap.profile) StorageService.saveBodyProfile(snap.profile as never, true);
    if (Array.isArray(snap.aiReports)) {
      localStorage.setItem('fit_tracker_ai_reports_v1', JSON.stringify(snap.aiReports));
    }
  }

  static mergeSnapshots(local: CloudSnapshot, remote: CloudSnapshot): CloudSnapshot {
    return {
      version: 4,
      updatedAt: new Date().toISOString(),
      gyms: mergeById(local.gyms as never, remote.gyms as never),
      machines: mergeById(local.machines as never, remote.machines as never),
      sessions: mergeById(local.sessions as never, remote.sessions as never),
      inbody: mergeById(local.inbody as never, remote.inbody as never),
      photos: mergeById(local.photos as never, remote.photos as never),
      selectedGymId: local.selectedGymId || remote.selectedGymId,
      profile: local.profile || remote.profile,
      draft: local.draft || remote.draft,
      aiReports: mergeById((local.aiReports as never) || [], (remote.aiReports as never) || []),
    };
  }

  static async pullRemote(): Promise<CloudSnapshot | null> {
    try {
      const res = await fetch(`${RAW_STATE}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || typeof json !== 'object') return null;
      return json as CloudSnapshot;
    } catch {
      return null;
    }
  }

  static async pushSnapshot(snap: CloudSnapshot): Promise<boolean> {
    if (!writeToken()) return false;
    const compact = compactForGit(snap);
    const files = tableFiles(compact);
    try {
      const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/main`);
      const parentSha = ref.object.sha as string;
      const parent = await gh(`/repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
      const tree = files.map(file => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: file.content,
      }));
      const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
      });
      const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({
          message: `cloud: sync ${compact.updatedAt}`,
          tree: newTree.sha,
          parents: [parentSha],
        }),
      });
      await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha }),
      });
      return true;
    } catch {
      return false;
    }
  }

  static async hydrate(): Promise<void> {
    if (this.hydrating) return;
    this.hydrating = true;
    try {
      const local = this.captureLocal();
      const remote = await this.pullRemote();
      if (remote && countRecords(remote) > 0) {
        this.applySnapshot(this.mergeSnapshots(local, remote));
      }
      const after = this.captureLocal();
      if (countRecords(after) > 0) {
        await this.pushSnapshot(after);
      }
    } finally {
      this.hydrating = false;
    }
  }

  static schedulePush() {
    if (this.hydrating) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      const snap = this.captureLocal();
      if (countRecords(snap) === 0 && !snap.draft) return;
      void this.pushSnapshot(snap);
    }, 1200);
  }
}

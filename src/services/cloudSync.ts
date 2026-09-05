import { StorageService } from './storage';
import { AiService } from './aiService';

export type CloudStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'need-token';

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
const PATH = 'cloud/state.json';
const TOKEN_KEY = 'fit_tracker_cloud_github_token';
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${PATH}`;
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function byId<T extends { id?: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id) map.set(item.id, item);
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

function countRecords(snap: CloudSnapshot): number {
  return (
    (snap.sessions?.length || 0) +
    (snap.inbody?.length || 0) +
    (snap.photos?.length || 0)
  );
}

export class CloudSync {
  static status: CloudStatus = 'idle';
  static lastError: string | null = null;
  static lastSyncedAt: string | null = null;
  private static pushTimer: ReturnType<typeof setTimeout> | null = null;
  private static hydrating = false;
  private static listeners = new Set<() => void>();

  static subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  static emit() {
    this.listeners.forEach(fn => fn());
  }

  static getToken(): string {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  static saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token.trim());
    this.status = token.trim() ? 'idle' : 'need-token';
    this.emit();
  }

  static captureLocal(): CloudSnapshot {
    let aiReports: unknown[] = [];
    try {
      aiReports = AiService.getSavedReports();
    } catch {
      aiReports = [];
    }
    return {
      version: 3,
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
    if (Array.isArray(snap.gyms) && snap.gyms.length) StorageService.saveGyms(snap.gyms as any, true);
    if (Array.isArray(snap.machines)) StorageService.saveMachines(snap.machines as any, true);
    if (Array.isArray(snap.sessions)) StorageService.saveSessions(snap.sessions as any, true);
    if (Array.isArray(snap.inbody)) StorageService.replaceInBodyRecords(snap.inbody as any);
    if (Array.isArray(snap.photos)) StorageService.replaceProgressPhotos(snap.photos as any);
    if (snap.selectedGymId) StorageService.setSelectedGymId(snap.selectedGymId, true);
    if (snap.profile) StorageService.saveBodyProfile(snap.profile as any, true);
    if (Array.isArray(snap.aiReports)) {
      localStorage.setItem('fit_tracker_ai_reports_v1', JSON.stringify(snap.aiReports));
    }
  }

  static mergeSnapshots(local: CloudSnapshot, remote: CloudSnapshot): CloudSnapshot {
    return {
      version: 3,
      updatedAt: new Date().toISOString(),
      gyms: mergeById(local.gyms as any, remote.gyms as any),
      machines: mergeById(local.machines as any, remote.machines as any),
      sessions: mergeById(local.sessions as any, remote.sessions as any),
      inbody: mergeById(local.inbody as any, remote.inbody as any),
      photos: mergeById(local.photos as any, remote.photos as any),
      selectedGymId: local.selectedGymId || remote.selectedGymId,
      profile: local.profile || remote.profile,
      draft: local.draft || remote.draft,
      aiReports: mergeById((local.aiReports as any) || [], (remote.aiReports as any) || []),
    };
  }

  static async pullRemote(): Promise<CloudSnapshot | null> {
    try {
      const res = await fetch(`${API_URL}?ref=main`, {
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.content) {
          const parsed = JSON.parse(base64ToUtf8(json.content));
          if (parsed && typeof parsed === 'object') return parsed as CloudSnapshot;
        }
      }
    } catch {
      // fallback below
    }
    try {
      const res = await fetch(`${RAW_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || typeof json !== 'object') return null;
      return json as CloudSnapshot;
    } catch {
      return null;
    }
  }

  static fileApi(path: string) {
    return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  }

  static async getFileSha(path = PATH): Promise<string | undefined> {
    const token = this.getToken();
    if (!token) return undefined;
    const res = await fetch(`${this.fileApi(path)}?ref=main`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json.sha as string | undefined;
  }

  static async putRepoFile(path: string, contentBase64: string, message: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    const sha = await this.getFileSha(path);
    const body: Record<string, string> = {
      message,
      content: contentBase64,
      branch: 'main',
    };
    if (sha) body.sha = sha;
    const res = await fetch(this.fileApi(path), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  static rawMediaUrl(path: string) {
    return `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${path}`;
  }

  static parseDataUrl(url: string): { mime: string; b64: string; ext: string } | null {
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    const mime = m[1];
    const ext = mime.includes('pdf') ? 'pdf' : mime.includes('png') ? 'png' : 'jpg';
    return { mime, b64: m[2], ext };
  }

  static async shrinkImageDataUrl(dataUrl: string, maxChars = 900_000): Promise<string> {
    if (!dataUrl.startsWith('data:image') || dataUrl.length <= maxChars) return dataUrl;
    return await new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const scale = Math.min(1, 1280 / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.72;
        let out = canvas.toDataURL('image/jpeg', quality);
        while (out.length > maxChars && quality > 0.35) {
          quality -= 0.12;
          out = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(out);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  static async uploadDataUrl(id: string, dataUrl: string): Promise<string | null> {
    const shrunk = await this.shrinkImageDataUrl(dataUrl);
    const parsed = this.parseDataUrl(shrunk);
    if (!parsed) return dataUrl.startsWith('http') ? dataUrl : null;
    if (parsed.b64.length > 1_000_000) return null;
    const path = `cloud/media/${id}.${parsed.ext}`;
    const ok = await this.putRepoFile(path, parsed.b64, `media ${id}`);
    if (!ok) return null;
    return this.rawMediaUrl(path);
  }

  static async uploadMedia(snap: CloudSnapshot): Promise<CloudSnapshot> {
    const photos: any[] = [];
    for (const p of (snap.photos as any[]) || []) {
      if (!p?.imageUrl || String(p.imageUrl).startsWith('http')) {
        photos.push(p);
        continue;
      }
      const url = await this.uploadDataUrl(p.id || `photo_${Date.now()}`, p.imageUrl);
      photos.push(url ? { ...p, imageUrl: url } : { ...p, imageUrl: '' });
    }
    const inbody: any[] = [];
    for (const r of (snap.inbody as any[]) || []) {
      if (!r?.imageUrl || String(r.imageUrl).startsWith('http')) {
        inbody.push(r);
        continue;
      }
      const url = await this.uploadDataUrl(r.id || `inbody_${Date.now()}`, r.imageUrl);
      inbody.push(url ? { ...r, imageUrl: url } : { ...r, imageUrl: undefined });
    }
    return { ...snap, photos, inbody };
  }

  static async pushSnapshot(snap: CloudSnapshot): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      this.status = 'need-token';
      this.emit();
      return false;
    }

    this.status = 'syncing';
    this.emit();

    try {
      const withMedia = await this.uploadMedia(snap);
      const compact = this.fitPayload(withMedia);
      StorageService.replaceInBodyRecords(compact.inbody as any);
      StorageService.replaceProgressPhotos(compact.photos as any);
      const sha = await this.getFileSha(PATH);
      const body: Record<string, string> = {
        message: `cloud sync ${compact.updatedAt}`,
        content: utf8ToBase64(JSON.stringify(compact)),
        branch: 'main',
      };
      if (sha) body.sha = sha;

      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub HTTP ${res.status}`);
      }

      this.status = 'ok';
      this.lastError = null;
      this.lastSyncedAt = compact.updatedAt;
      this.emit();
      return true;
    } catch (e: any) {
      this.status = 'error';
      this.lastError = e?.message || 'Ошибка облака';
      this.emit();
      return false;
    }
  }

  static fitPayload(snap: CloudSnapshot): CloudSnapshot {
    let next = { ...snap };
    let json = JSON.stringify(next);
    if (json.length < 900_000) return next;

    next = {
      ...next,
      photos: (next.photos as any[]).map(p =>
        String(p?.imageUrl || '').startsWith('http') ? p : { ...p, imageUrl: '' },
      ),
      inbody: (next.inbody as any[]).map(r =>
        String(r?.imageUrl || '').startsWith('http') ? r : { ...r, imageUrl: undefined },
      ),
    };
    json = JSON.stringify(next);
    if (json.length < 900_000) return next;

    next = { ...next, photos: [] };
    return next;
  }

  static async hydrate(): Promise<void> {
    if (this.hydrating) return;
    this.hydrating = true;
    this.status = 'syncing';
    this.emit();

    try {
      const local = this.captureLocal();
      const remote = await this.pullRemote();

      if (remote && countRecords(remote) > 0) {
        const merged = this.mergeSnapshots(local, remote);
        this.applySnapshot(merged);
      }

      const after = this.captureLocal();
      if (countRecords(after) > 0) {
        await this.pushSnapshot(after);
      } else if (!this.getToken()) {
        this.status = 'need-token';
        this.emit();
      } else {
        this.status = 'ok';
        this.emit();
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
      if (countRecords(snap) === 0 && !(snap.draft as any)) return;
      void this.pushSnapshot(snap);
    }, 1200);
  }
}

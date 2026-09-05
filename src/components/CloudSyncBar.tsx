import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { CloudSync, type CloudStatus } from '../services/cloudSync';

function statusText(status: CloudStatus, error: string | null) {
  if (status === 'syncing') return 'Пишу на сайт…';
  if (status === 'ok') return 'Тренировки, InBody и фото на сайте';
  if (status === 'error') return error || 'Ошибка синхронизации';
  if (status === 'need-token') return 'С телефона, где есть данные, вставь ключ — и всё уедет на сайт';
  return 'Облако сайта';
}

export const CloudSyncBar: React.FC = () => {
  const [, setTick] = useState(0);
  const [token, setToken] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => CloudSync.subscribe(() => setTick(n => n + 1)), []);

  useEffect(() => {
    setToken(CloudSync.getToken());
    setOpen(!CloudSync.getToken());
  }, []);

  const saveAndPush = async () => {
    CloudSync.saveToken(token);
    await CloudSync.hydrate();
  };

  const status = CloudSync.status;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {status === 'syncing' ? (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          ) : status === 'ok' ? (
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Облако сайта</div>
            <div className="text-[11px] text-zinc-200 leading-snug">{statusText(status, CloudSync.lastError)}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => void CloudSync.hydrate()}
            className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300"
            aria-label="Синхронизировать"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-700 text-zinc-300"
          >
            {open ? 'Скрыть' : 'Ключ'}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) →
            Generate. Галка <span className="text-zinc-200 font-bold">repo</span>. Вставь сюда{' '}
            <span className="text-zinc-200 font-bold">на том телефоне, где уже есть тренировки</span>.
          </p>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_…"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
          />
          <button
            type="button"
            onClick={() => void saveAndPush()}
            className="w-full bg-emerald-400 text-zinc-950 font-black text-xs py-2 rounded-lg"
          >
            Залить всё на сайт
          </button>
        </div>
      )}
    </div>
  );
};

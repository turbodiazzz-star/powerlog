import React, { useEffect, useRef, useState } from 'react';
import type { InBodyRecord } from '../types/workout';
import {
  buildInBodyBars,
  deriveHeightCm,
  KEY_METRICS,
  type BodyProfile,
  type InBodyBarModel,
  type InBodyZone,
} from '../utils/inBodyNorms';

const ZONE_COLOR: Record<InBodyZone, string> = {
  under: 'text-sky-300',
  normal: 'text-amber-300',
  over: 'text-rose-400',
};

const ZONE_BADGE: Record<InBodyZone, string> = {
  under: 'bg-sky-950 text-sky-300 border-sky-800',
  normal: 'bg-amber-950 text-amber-300 border-amber-800',
  over: 'bg-rose-950 text-rose-300 border-rose-800',
};

function Delta({ delta, invertGood }: { delta?: number; invertGood?: boolean }) {
  if (delta === undefined || delta === 0) return null;
  const up = delta > 0;
  const good = invertGood ? !up : up;
  return (
    <span className={`font-mono text-[10px] font-bold ${good ? 'text-emerald-400' : 'text-rose-400'}`}>
      {up ? '+' : ''}
      {delta}
    </span>
  );
}

function vsStartClass(metricKey: string, diff: number): string {
  if (diff === 0) return 'text-zinc-500';
  if (metricKey === 'weightKg') return 'text-zinc-300';
  if (metricKey === 'muscleMassKg') return diff > 0 ? 'text-emerald-400' : 'text-rose-400';
  return diff < 0 ? 'text-emerald-400' : 'text-rose-400';
}

function InBodyBar({ bar }: { bar: InBodyBarModel }) {
  const hasValue = bar.value !== undefined;
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400">{bar.label}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-zinc-950 font-mono leading-none">
              {hasValue ? bar.value : '—'}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold">{bar.unit}</span>
            {bar.key !== 'weightKg' && (
              <Delta
                delta={bar.delta}
                invertGood={bar.key === 'bodyFatPercent' || bar.key === 'fatMassKg'}
              />
            )}
            {bar.key === 'weightKg' && bar.delta !== undefined && bar.delta !== 0 && (
              <span className="font-mono text-[10px] font-bold text-zinc-500">
                {bar.delta > 0 ? '+' : ''}
                {bar.delta}
              </span>
            )}
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border ${ZONE_BADGE[bar.zone]}`}>
          {bar.zoneLabel}
        </span>
      </div>

      <div className="relative h-5 rounded-sm overflow-hidden border border-zinc-800">
        <div className="absolute inset-0 flex">
          <div className="bg-sky-500/80" style={{ width: `${bar.normalStartPct}%` }} />
          <div className="bg-amber-400" style={{ width: `${bar.normalEndPct - bar.normalStartPct}%` }} />
          <div className="bg-rose-500/85 flex-1" />
        </div>
        {hasValue && (
          <div className="absolute top-0 bottom-0 w-0 z-10" style={{ left: `${bar.markerPct}%` }}>
            <div className="absolute -translate-x-1/2 top-0 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-zinc-950" />
            <div className="absolute -translate-x-1/2 bottom-0 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-l-transparent border-r-transparent border-b-zinc-950" />
            <div className="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-[2px] bg-zinc-950" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-[9px] font-mono text-zinc-500">
        <span className="text-sky-400/80">− недостаток</span>
        <span className="text-amber-400/90">норма</span>
        <span className="text-rose-400/80">+ превышение</span>
      </div>
      <div className={`text-[9px] font-mono ${ZONE_COLOR[bar.zone]}`}>
        {bar.standardText}
        {bar.percentOfStandard !== undefined && bar.key !== 'bodyFatPercent' ? ` · ${bar.percentOfStandard}%` : ''}
      </div>
    </div>
  );
}

function MetricRow({
  records,
  metricKey,
  label,
  unit,
  color,
}: {
  records: InBodyRecord[];
  metricKey: keyof InBodyRecord;
  label: string;
  unit: string;
  color: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const points = records
    .filter(r => typeof r[metricKey] === 'number')
    .map(r => ({ date: r.date, value: r[metricKey] as number }));

  if (points.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 border-b border-zinc-800/80">
        <div className="w-16 shrink-0 text-[10px] font-black uppercase text-zinc-500">{label}</div>
        <span className="text-[10px] text-zinc-600">нет данных</span>
      </div>
    );
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;
  const step = 44;
  const pad = 16;
  const w = Math.max(points.length * step + pad * 2, 200);
  const h = 52;
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - 10 - ((p.value - min) / range) * (h - 22);
    return { x, y, ...p };
  });
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const diff = Math.round((last.value - first.value) * 10) / 10;
  const sel = selected !== null ? points[selected] : null;

  return (
    <div className="py-2 border-b border-zinc-800/80 last:border-0 space-y-1">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wide text-zinc-400 w-14 shrink-0">{label}</span>
          <span className="text-sm font-black font-mono text-white">
            {last.value}
            <span className="text-[9px] text-zinc-500 font-bold ml-0.5">{unit}</span>
          </span>
        </div>
        {points.length > 1 && (
          <span className={`text-[11px] font-mono font-black ${vsStartClass(String(metricKey), diff)}`}>
            {diff > 0 ? '+' : ''}
            {diff} {unit}
          </span>
        )}
      </div>

      {sel && (
        <div className="text-[10px] font-mono text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1">
          {sel.date}: <span className="text-white font-black">{sel.value} {unit}</span>
        </div>
      )}

      <div
        className="overflow-x-auto touch-pan-x -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: w, minWidth: w }}
          className="h-14 overflow-visible"
        >
          <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((c, i) => {
            const active = selected === i;
            return (
              <g key={i} onClick={() => setSelected(i)} className="cursor-pointer">
                <circle cx={c.x} cy={c.y} r="12" fill="transparent" />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={active ? 5 : 3.2}
                  fill={active ? color : '#09090b'}
                  stroke={color}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export const InBodyInfographic: React.FC<{
  recordsAsc: InBodyRecord[];
  profile: BodyProfile;
  onDelete?: (id: string) => void;
  onOpenScan?: (url: string) => void;
}> = ({ recordsAsc, profile, onDelete, onOpenScan }) => {
  if (recordsAsc.length === 0) return null;

  const latest = recordsAsc[recordsAsc.length - 1];
  const previous = recordsAsc.length > 1 ? recordsAsc[recordsAsc.length - 2] : undefined;
  const bars = buildInBodyBars(latest, previous, profile);
  const heightCm = profile.heightCm || deriveHeightCm(latest);
  const baseline = recordsAsc[0];
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [recordsAsc.length]);

  return (
    <div className="space-y-3">
      <div className="bg-white text-zinc-950 rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-2">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">InBody</div>
            <h3 className="text-sm font-black leading-tight">Анализ состава тела</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {latest.date}
              {heightCm ? ` · рост ≈ ${heightCm} см` : ''}
              {latest.bmi ? ` · ИМТ ${latest.bmi}` : ''}
            </p>
          </div>
          {latest.inBodyScore !== undefined && (
            <div className="text-right">
              <div className="text-[9px] font-black uppercase text-zinc-500">Score</div>
              <div className="text-2xl font-black leading-none">{latest.inBodyScore}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] text-[8px] font-black uppercase tracking-wider text-zinc-500 px-0.5">
          <span>Недостаток</span>
          <span className="text-center text-amber-700">Норма</span>
          <span className="text-right">Превышение</span>
        </div>

        <div className="space-y-3">
          {bars.map(bar => (
            <InBodyBar key={bar.key} bar={bar} />
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-0.5">
        <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 pb-1">
          Динамика от {baseline.date}
        </div>
        {KEY_METRICS.map(m => (
          <MetricRow
            key={m.key}
            records={recordsAsc}
            metricKey={m.key}
            label={m.label}
            unit={m.unit}
            color={m.color}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            История состава тела
          </h3>
          <span className="text-[9px] text-zinc-600 font-mono">← раньше · актуальнее →</span>
        </div>
        <div
          ref={historyRef}
          className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {recordsAsc.map(rec => {
            const prev = recordsAsc[recordsAsc.findIndex(r => r.id === rec.id) - 1];
            const recBars = buildInBodyBars(rec, prev, profile);
            const isLatest = rec.id === latest.id;
            return (
              <div
                key={rec.id}
                className={`snap-start shrink-0 w-[78%] max-w-[280px] rounded-2xl p-3 space-y-2 border ${
                  isLatest ? 'bg-zinc-900 border-emerald-800' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black font-mono text-white">
                    {rec.date}
                    {isLatest ? ' · сейчас' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    {rec.inBodyScore !== undefined && (
                      <span className="text-[10px] font-black text-emerald-400">{rec.inBodyScore} б.</span>
                    )}
                    {rec.imageUrl && onOpenScan && (
                      <button
                        type="button"
                        onClick={() => onOpenScan(rec.imageUrl!)}
                        className="text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800"
                      >
                        Скан
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(rec.id)} className="p-0.5 text-zinc-600 hover:text-rose-400 text-sm leading-none">
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {recBars.map(b => (
                    <div key={b.key} className="bg-zinc-950 rounded-lg px-2 py-1.5 border border-zinc-800/80">
                      <div className="text-[8px] font-black uppercase text-zinc-500">{b.label}</div>
                      <div className="text-xs font-black font-mono text-white">
                        {b.value ?? '—'} <span className="text-[9px] text-zinc-500">{b.unit}</span>
                      </div>
                      <div className={`text-[8px] font-bold ${ZONE_COLOR[b.zone]}`}>{b.zoneLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

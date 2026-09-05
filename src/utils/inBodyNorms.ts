import type { InBodyRecord } from '../types/workout';

export type BodyGender = 'male' | 'female';
export type InBodyZone = 'under' | 'normal' | 'over';

export interface BodyProfile {
  gender: BodyGender;
  heightCm?: number;
}

export interface InBodyBarModel {
  key: 'weightKg' | 'muscleMassKg' | 'bodyFatPercent' | 'fatMassKg';
  label: string;
  unit: string;
  value?: number;
  /** Position 0–100 on the InBody-style 70%…160% (or PBF) scale */
  markerPct: number;
  /** Normal band start/end on the same 0–100 track */
  normalStartPct: number;
  normalEndPct: number;
  zone: InBodyZone;
  zoneLabel: string;
  standardText: string;
  percentOfStandard?: number;
  delta?: number;
}

const SCALE_MIN = 70;
const SCALE_MAX = 160;
const NORMAL_LOW = 85;
const NORMAL_HIGH = 115;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pctOnScale(percentOfStandard: number): number {
  return ((clamp(percentOfStandard, SCALE_MIN, SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

function zoneFromPercent(percentOfStandard: number): InBodyZone {
  if (percentOfStandard < NORMAL_LOW) return 'under';
  if (percentOfStandard > NORMAL_HIGH) return 'over';
  return 'normal';
}

function zoneLabel(zone: InBodyZone): string {
  if (zone === 'under') return 'Недостаток';
  if (zone === 'over') return 'Превышение';
  return 'Норма';
}

export function deriveHeightCm(record: InBodyRecord): number | undefined {
  if (!record.bmi || record.bmi <= 0 || !record.weightKg) return undefined;
  return Math.round(Math.sqrt(record.weightKg / record.bmi) * 1000) / 10;
}

export function getStandardWeightKg(record: InBodyRecord, profile: BodyProfile): number {
  const heightCm = profile.heightCm || deriveHeightCm(record);
  if (heightCm && heightCm > 120) {
    const h = heightCm / 100;
    return Math.round(22 * h * h * 10) / 10;
  }
  return record.weightKg;
}

export function buildInBodyBars(
  record: InBodyRecord,
  previous: InBodyRecord | undefined,
  profile: BodyProfile
): InBodyBarModel[] {
  const stdW = getStandardWeightKg(record, profile);
  const smmFactor = profile.gender === 'female' ? 0.36 : 0.45;
  const pbfStd = profile.gender === 'female' ? 23 : 15;
  const stdSmm = Math.round(stdW * smmFactor * 10) / 10;
  const stdFat = Math.round(stdW * (pbfStd / 100) * 10) / 10;

  const pbfLow = profile.gender === 'female' ? 18 : 10;
  const pbfHigh = profile.gender === 'female' ? 28 : 20;
  const pbfMin = 5;
  const pbfMax = 40;

  const weightPct = stdW > 0 && record.weightKg ? (record.weightKg / stdW) * 100 : 100;
  const smmPct =
    stdSmm > 0 && record.muscleMassKg ? (record.muscleMassKg / stdSmm) * 100 : undefined;
  const fatPct =
    stdFat > 0 && record.fatMassKg ? (record.fatMassKg / stdFat) * 100 : undefined;

  const pbf = record.bodyFatPercent;
  let pbfZone: InBodyZone = 'normal';
  if (pbf !== undefined) {
    if (pbf < pbfLow) pbfZone = 'under';
    else if (pbf > pbfHigh) pbfZone = 'over';
  }
  const pbfMarker = pbf !== undefined ? ((clamp(pbf, pbfMin, pbfMax) - pbfMin) / (pbfMax - pbfMin)) * 100 : 50;

  return [
    {
      key: 'weightKg',
      label: 'Вес',
      unit: 'кг',
      value: record.weightKg,
      markerPct: pctOnScale(weightPct),
      normalStartPct: pctOnScale(NORMAL_LOW),
      normalEndPct: pctOnScale(NORMAL_HIGH),
      zone: zoneFromPercent(weightPct),
      zoneLabel: zoneLabel(zoneFromPercent(weightPct)),
      standardText: `стандарт ${stdW} кг`,
      percentOfStandard: Math.round(weightPct),
      delta: previous ? round1(record.weightKg - previous.weightKg) : undefined,
    },
    {
      key: 'muscleMassKg',
      label: 'Мышцы SMM',
      unit: 'кг',
      value: record.muscleMassKg,
      markerPct: smmPct !== undefined ? pctOnScale(smmPct) : 50,
      normalStartPct: pctOnScale(NORMAL_LOW),
      normalEndPct: pctOnScale(NORMAL_HIGH),
      zone: smmPct !== undefined ? zoneFromPercent(smmPct) : 'normal',
      zoneLabel: smmPct !== undefined ? zoneLabel(zoneFromPercent(smmPct)) : 'нет данных',
      standardText: `стандарт ${stdSmm} кг`,
      percentOfStandard: smmPct !== undefined ? Math.round(smmPct) : undefined,
      delta:
        previous && record.muscleMassKg !== undefined && previous.muscleMassKg !== undefined
          ? round1(record.muscleMassKg - previous.muscleMassKg)
          : undefined,
    },
    {
      key: 'bodyFatPercent',
      label: 'Жир PBF',
      unit: '%',
      value: record.bodyFatPercent,
      markerPct: pbfMarker,
      normalStartPct: ((pbfLow - pbfMin) / (pbfMax - pbfMin)) * 100,
      normalEndPct: ((pbfHigh - pbfMin) / (pbfMax - pbfMin)) * 100,
      zone: pbf !== undefined ? pbfZone : 'normal',
      zoneLabel: pbf !== undefined ? zoneLabel(pbfZone) : 'нет данных',
      standardText: `норма ${pbfLow}–${pbfHigh} %`,
      percentOfStandard: pbf,
      delta:
        previous && record.bodyFatPercent !== undefined && previous.bodyFatPercent !== undefined
          ? round1(record.bodyFatPercent - previous.bodyFatPercent)
          : undefined,
    },
    {
      key: 'fatMassKg',
      label: 'Жир BFM',
      unit: 'кг',
      value: record.fatMassKg,
      markerPct: fatPct !== undefined ? pctOnScale(fatPct) : 50,
      normalStartPct: pctOnScale(NORMAL_LOW),
      normalEndPct: pctOnScale(NORMAL_HIGH),
      zone: fatPct !== undefined ? zoneFromPercent(fatPct) : 'normal',
      zoneLabel: fatPct !== undefined ? zoneLabel(zoneFromPercent(fatPct)) : 'нет данных',
      percentOfStandard: fatPct !== undefined ? Math.round(fatPct) : undefined,
      standardText: `стандарт ${stdFat} кг`,
      delta:
        previous && record.fatMassKg !== undefined && previous.fatMassKg !== undefined
          ? round1(record.fatMassKg - previous.fatMassKg)
          : undefined,
    },
  ];
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export const KEY_METRICS: Array<{
  key: 'weightKg' | 'muscleMassKg' | 'bodyFatPercent' | 'fatMassKg';
  label: string;
  unit: string;
  color: string;
}> = [
  { key: 'weightKg', label: 'Вес', unit: 'кг', color: '#38bdf8' },
  { key: 'muscleMassKg', label: 'Мышцы', unit: 'кг', color: '#34d399' },
  { key: 'bodyFatPercent', label: 'Жир', unit: '%', color: '#fbbf24' },
  { key: 'fatMassKg', label: 'Жир', unit: 'кг', color: '#f87171' },
];

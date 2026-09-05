import type { MachineOption } from '../data/machineVariants';
import { getMachineOption, isAssistedMachine } from '../data/machineVariants';

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calcWorkingLoad(
  machineName: string | undefined,
  inputKg: number,
  bodyWeightKg: number
): {
  effectiveKg: number;
  formula: string;
  shortHint: string;
  inputLabel: string;
} {
  const opt = getMachineOption(machineName);
  const tare = opt?.baseTareWeight || 0;
  const assisted = isAssistedMachine(machineName);
  const bodyweightMove = !!opt?.isBodyweight;

  if (assisted) {
    const body = bodyWeightKg > 0 ? bodyWeightKg : 0;
    const assist = inputKg;
    const effective = Math.max(0, round1(body - assist));
    if (!body) {
      return {
        effectiveKg: 0,
        formula: `вес тела − ${assist} кг разгрузки`,
        shortHint: `−${assist}`,
        inputLabel: 'Разгрузка',
      };
    }
    return {
      effectiveKg: effective,
      formula: `${body} − ${assist} = ${effective} кг`,
      shortHint: `${body}−${assist}=${effective}`,
      inputLabel: 'Разгрузка',
    };
  }

  if (tare > 0) {
    const effective = round1(inputKg + tare);
    const tareName = tare > 20 ? 'платформа' : 'гриф';
    return {
      effectiveKg: effective,
      formula: `${inputKg} + ${tare} (${tareName}) = ${effective} кг`,
      shortHint: `+${tare}=${effective}`,
      inputLabel: 'Блины',
    };
  }

  if (bodyweightMove) {
    const body = bodyWeightKg > 0 ? bodyWeightKg : 0;
    const extra = inputKg;
    const effective = round1(body + extra);
    if (!body) {
      return {
        effectiveKg: extra,
        formula: extra > 0 ? `свой вес + ${extra} кг` : 'свой вес',
        shortHint: extra > 0 ? `BW+${extra}` : 'BW',
        inputLabel: 'Доп. вес',
      };
    }
    return {
      effectiveKg: effective,
      formula: extra > 0 ? `${body} + ${extra} = ${effective} кг` : `${body} кг (свой вес)`,
      shortHint: extra > 0 ? `${body}+${extra}` : `${body}`,
      inputLabel: 'Доп. вес',
    };
  }

  return {
    effectiveKg: inputKg,
    formula: `${inputKg} кг`,
    shortHint: `${inputKg}`,
    inputLabel: 'Вес',
  };
}

export function parseRepRange(targetReps: string): { low: number; high: number } {
  const nums = (targetReps.match(/\d+/g) || []).map(n => parseInt(n, 10));
  if (nums.length === 0) return { low: 8, high: 12 };
  if (nums.length === 1) return { low: nums[0], high: nums[0] };
  return { low: nums[0], high: nums[nums.length - 1] };
}

export function localLoadRecommendation(params: {
  lastSets: { weightKg: number; reps: number }[];
  targetSets: number;
  targetReps: string;
  option?: MachineOption;
}): { inputKg: number; sets: number; reps: string; note: string } {
  const { lastSets, targetSets, targetReps, option } = params;
  const { high } = parseRepRange(targetReps);

  if (!lastSets.length) {
    return {
      inputKg: 0,
      sets: targetSets,
      reps: targetReps,
      note: 'Нет истории — поставьте стартовый вес',
    };
  }

  const lastWeight = lastSets[lastSets.length - 1]?.weightKg || lastSets[0].weightKg;
  const allHitHigh = lastSets.every(s => s.reps >= high);
  const avgReps = lastSets.reduce((a, s) => a + s.reps, 0) / lastSets.length;

  let next = lastWeight;
  let note = `Повторить ${lastWeight} кг, ${targetSets}×${targetReps}`;

  if (allHitHigh) {
    const step = option?.isAssisted ? -2.5 : 2.5;
    next = Math.max(0, round1(lastWeight + step));
    note = option?.isAssisted
      ? `Закрыли верх диапазона — разгрузку −2.5 кг`
      : `Закрыли верх диапазона — +2.5 кг`;
  } else if (avgReps < high - 2) {
    note = `Вес тот же, доберите повторы до ${high}`;
  }

  return { inputKg: next, sets: targetSets, reps: targetReps, note };
}

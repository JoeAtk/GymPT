import { LiftEntry } from './chat-log';

// Estimate 1RM using Epley formula
export function estimate1RM(weight: number | undefined, reps: number) {
  if (!weight || weight <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

// Group lifts by exercise name and produce time series of estimated 1RM
export function getExerciseSeries(lifts: LiftEntry[]) {
  const map: Record<string, { timestamp: number; est1RM: number }[]> = {};
  for (const l of lifts) {
    const est = estimate1RM(l.weight ?? 0, l.reps);
    if (!map[l.name]) map[l.name] = [];
    map[l.name].push({ timestamp: l.timestamp, est1RM: est });
  }
  // sort each series by timestamp
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => a.timestamp - b.timestamp);
  }
  return map;
}

// Convert series to relative strength percent (normalized to first non-zero value)
export function getRelativeSeries(series: { timestamp: number; est1RM: number }[]) {
  if (!series || series.length === 0) return [];
  const first = series.find((s) => s.est1RM > 0)?.est1RM ?? 0;
  if (first === 0) return series.map((s) => ({ ...s, pct: 0 }));
  return series.map((s) => ({ ...s, pct: Math.round((s.est1RM / first) * 100) }));
}

// Default split mapping to illustrative exercises; users' logged lifts will populate actual exercises
export const DEFAULT_SPLITS: Record<string, string[]> = {
  push: ['Bench Press', 'Overhead Press', 'Incline Bench'],
  pull: ['Deadlift', 'Barbell Row', 'Pull Up'],
  legs: ['Squat', 'Romanian Deadlift', 'Leg Press'],
};

export type RelativePoint = { timestamp: number; pct: number; est1RM: number };

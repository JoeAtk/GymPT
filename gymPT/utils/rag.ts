import { LiftEntry } from './chat-log';

export type Split = 'leg' | 'push' | 'pull' | 'full body' | 'unknown';

export function classifyLift(name: string): Split {
  const n = name.toLowerCase();
  if (/(squat|leg|deadlift|lunge|hamstring|glute)/.test(n)) return 'leg';
  if (/(bench|press|overhead|push|chest|tricep|shoulder)/.test(n)) return 'push';
  if (/(row|pull|deadlift|chin|biceps|lat|back|pull-up|pullups|pull-ups)/.test(n)) return 'pull';
  return 'unknown';
}

export function getSessionSplitFromLifts(sessionLifts: LiftEntry[]): Split {
  const counts: Record<string, number> = {};
  for (const l of sessionLifts) {
    const s = classifyLift(l.name);
    counts[s] = (counts[s] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'unknown';
  const top = entries[0][0];
  if (top === 'unknown') return 'unknown';
  return top as Split;
}

export function getNextSplitFromLifts(lifts: LiftEntry[] | undefined): Split {
  if (!lifts || lifts.length === 0) return 'full body';
  // group lifts by day (YYYY-MM-DD)
  const byDay: Record<string, LiftEntry[]> = {};
  for (const l of lifts) {
    const d = new Date(l.timestamp).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || [];
    byDay[d].push(l);
  }
  const days = Object.keys(byDay).sort();
  const lastDay = days[days.length - 1];
  const lastSession = byDay[lastDay] ?? [];
  const lastSplit = getSessionSplitFromLifts(lastSession);

  // simple cycle: leg -> push -> pull -> leg
  if (lastSplit === 'leg') return 'push';
  if (lastSplit === 'push') return 'pull';
  if (lastSplit === 'pull') return 'leg';
  // fallback
  return 'full body';
}

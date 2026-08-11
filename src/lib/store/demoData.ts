import { subDays } from 'date-fns';
import { nightOf } from '@/lib/sleep';
import type { SleepSession } from '@/lib/types';

/**
 * Generated nights, used only when VITE_DEMO=1.
 *
 * The chart is the whole product, and it cannot be judged against an empty
 * calendar - the point of it is the shape a few weeks of nights make. Seeded so
 * the same run always produces the same nights, otherwise a visual change and a
 * new random draw are impossible to tell apart.
 */

/** mulberry32: small, seeded, and good enough for fake bedtimes. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Two uniforms into a normal, so bedtimes cluster instead of spreading flat. */
function normal(next: () => number, mean: number, deviation: number): number {
  const u = Math.max(next(), Number.EPSILON);
  const v = next();
  return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function at(day: Date, hour: number): Date {
  const result = new Date(day);
  result.setHours(0, 0, 0, 0);
  return new Date(result.getTime() + hour * 3_600_000);
}

export function demoSessions(nights = 70): SleepSession[] {
  const next = random(20260811);
  const sessions: SleepSession[] = [];
  const today = new Date();
  let id = 1;

  for (let offset = 1; offset <= nights; offset += 1) {
    const evening = subDays(today, offset);
    const weekend = evening.getDay() === 5 || evening.getDay() === 6;

    // Two nights in a hundred simply aren't tracked - the stack should be
    // exercised with gaps in it.
    if (next() < 0.06) continue;

    const bedtime = normal(next, weekend ? 23.4 : 22.1, weekend ? 0.9 : 0.55);
    const duration = Math.min(10.5, Math.max(4.5, normal(next, 8.1, 0.85)));

    const push = (startHour: number, hours: number) => {
      const start = at(evening, startHour);
      const end = new Date(start.getTime() + hours * 3_600_000);
      sessions.push({
        id: id++,
        external_id: `demo-${id}`,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        night_of: nightOf(start),
      });
    };

    // Roughly one night in eight is broken by a stretch awake.
    if (next() < 0.12) {
      const firstLeg = duration * (0.3 + next() * 0.3);
      const awake = 0.4 + next() * 0.9;
      push(bedtime, firstLeg);
      push(bedtime + firstLeg + awake, duration - firstLeg);
    } else {
      push(bedtime, duration);
    }
  }

  return sessions.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

import { format, parseISO } from 'date-fns';
import type { SunTimes } from './sun';
import type { SleepSession } from './types';

/** A filled stretch of the 24-hour bar, in hours from local midnight. */
export interface Segment {
  from: number;
  to: number;
}

export interface Night {
  /** yyyy-MM-dd of the evening the night began. */
  key: string;
  date: Date;
  sessions: SleepSession[];
  /** Everything slept that night, wrapped into a single 0-24 bar. */
  segments: Segment[];
  /** Total time asleep, in hours - gaps between sessions are not counted. */
  hours: number;
  /** Local hour of day the first session started. */
  bedtime: number;
  /** Local hour of day the last session ended. */
  wake: number;
  /** How many times the tracker was stopped and restarted before morning. */
  interruptions: number;
}

/** Hour of day, fractional, in the viewer's local timezone. */
export function hourOfDay(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/**
 * Splits a stretch of sleep across the midnight boundary.
 *
 * The bar runs midnight to midnight, so a night that starts at 22:00 fills the
 * last two hours on the right and continues from the left edge - two segments
 * on the same row rather than two rows.
 */
export function wrapSegments(startHour: number, durationHours: number): Segment[] {
  if (durationHours <= 0) return [];
  if (durationHours >= 24) return [{ from: 0, to: 24 }];

  const from = ((startHour % 24) + 24) % 24;
  const to = from + durationHours;

  return to <= 24
    ? [{ from, to }]
    : [
        { from, to: 24 },
        { from: 0, to: to - 24 },
      ];
}

/**
 * Sunset to sunrise, wrapped across midnight exactly like a night is.
 *
 * Drawn behind every row so the two shapes can be compared directly: sleep that
 * sits inside the dark band is sleep in step with the daylight.
 */
export function darkSegments(sun: SunTimes): Segment[] {
  if (sun.sunrise === null || sun.sunset === null) {
    return sun.daylightHours >= 24 ? [] : [{ from: 0, to: 24 }];
  }
  return wrapSegments(sun.sunset, (24 + sun.sunrise - sun.sunset) % 24);
}

/**
 * The night a session is filed under, named after the evening it began.
 *
 * Anything starting after midday opens a new night; anything before it closes
 * the one already running. Midday is the natural split because it is the point
 * furthest from when anyone sleeps - a bedtime drifting from 21:00 to 03:00
 * never crosses it, so a night never jumps rows just because it ran late.
 */
export function nightOf(start: Date): string {
  const night = new Date(start);
  if (start.getHours() < 12) night.setDate(night.getDate() - 1);
  return format(night, 'yyyy-MM-dd');
}

/** Groups sessions into nights, newest first. */
export function buildNights(sessions: SleepSession[]): Night[] {
  const byNight = new Map<string, SleepSession[]>();

  for (const session of sessions) {
    const list = byNight.get(session.night_of);
    if (list) list.push(session);
    else byNight.set(session.night_of, [session]);
  }

  const nights: Night[] = [];

  for (const [key, group] of byNight) {
    const ordered = [...group].sort((a, b) => a.started_at.localeCompare(b.started_at));

    const segments: Segment[] = [];
    let hours = 0;

    for (const session of ordered) {
      const start = parseISO(session.started_at);
      const duration = (parseISO(session.ended_at).getTime() - start.getTime()) / 3_600_000;
      if (duration <= 0) continue;
      hours += duration;
      segments.push(...wrapSegments(hourOfDay(start), duration));
    }

    if (!segments.length) continue;

    const first = parseISO(ordered[0].started_at);
    const last = parseISO(ordered[ordered.length - 1].ended_at);

    nights.push({
      key,
      date: parseISO(`${key}T00:00:00`),
      sessions: ordered,
      segments,
      hours,
      bedtime: hourOfDay(first),
      wake: hourOfDay(last),
      interruptions: ordered.length - 1,
    });
  }

  return nights.sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Re-centres the clock on midday so ordinary statistics work on times that
 * straddle midnight. 23:50 and 00:10 are twenty minutes apart, but as raw hours
 * they average to midday - the one time of day nobody in this dataset is
 * asleep. Anchored at noon they are 11.83 and 12.17, and behave.
 */
function sinceNoon(hour: number): number {
  return hour >= 12 ? hour - 12 : hour + 12;
}

function fromNoon(value: number): number {
  return (value + 12) % 24;
}

export interface Spread {
  /** Local hour of day. */
  mean: number;
  /** Standard deviation, in minutes. */
  deviationMinutes: number;
}

function spread(hours: number[]): Spread | null {
  if (!hours.length) return null;

  const anchored = hours.map(sinceNoon);
  const mean = anchored.reduce((sum, v) => sum + v, 0) / anchored.length;
  const variance =
    anchored.reduce((sum, v) => sum + (v - mean) ** 2, 0) / anchored.length;

  return { mean: fromNoon(mean), deviationMinutes: Math.sqrt(variance) * 60 };
}

export interface SleepStats {
  nights: number;
  /** Mean hours asleep per night. */
  averageHours: number;
  bedtime: Spread | null;
  wake: Spread | null;
  /** Mean midpoint of sleep - the standard chronotype measure. */
  midpoint: Spread | null;
  longest: Night | null;
  shortest: Night | null;
}

export function summarise(nights: Night[]): SleepStats {
  if (!nights.length) {
    return {
      nights: 0,
      averageHours: 0,
      bedtime: null,
      wake: null,
      midpoint: null,
      longest: null,
      shortest: null,
    };
  }

  const sorted = [...nights].sort((a, b) => a.hours - b.hours);

  return {
    nights: nights.length,
    averageHours: nights.reduce((sum, n) => sum + n.hours, 0) / nights.length,
    bedtime: spread(nights.map((n) => n.bedtime)),
    wake: spread(nights.map((n) => n.wake)),
    // Taken from the anchored bedtime so a midpoint just after midnight doesn't
    // average against one just before it.
    midpoint: spread(
      nights.map((n) => fromNoon(sinceNoon(n.bedtime) + (sinceNoon(n.wake) - sinceNoon(n.bedtime)) / 2)),
    ),
    longest: sorted[sorted.length - 1],
    shortest: sorted[0],
  };
}

/** '22:04' from a fractional hour of day. */
export function formatClock(hour: number): string {
  const total = Math.round(((hour % 24) + 24) % 24 * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** '7h 42m' from a count of hours. */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '—';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** '±34m', or '±1h 04m' once a deviation grows past an hour. */
export function formatDeviation(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `±${rounded}m`;
  return `±${Math.floor(rounded / 60)}h ${String(rounded % 60).padStart(2, '0')}m`;
}

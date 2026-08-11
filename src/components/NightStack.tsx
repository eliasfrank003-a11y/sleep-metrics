import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import type { Night } from '@/lib/sleep';
import { sunTimes, type Place } from '@/lib/sun';
import { HourAxis } from './HourAxis';
import { NightRow } from './NightRow';

interface NightStackProps {
  /** Newest first. */
  nights: Night[];
  place: Place;
  guides: { bedtime: number | null; wake: number | null };
  /** Nights to draw, counting back from the most recent one tracked. */
  window: number;
}

/**
 * Every night from the latest tracked one back, newest at the top.
 *
 * Untracked nights are drawn as empty rows rather than skipped. Closing the gap
 * would put two nights a week apart on adjacent lines and quietly turn a broken
 * routine into a tidy one.
 */
export function NightStack({ nights, place, guides, window }: NightStackProps) {
  const rows = useMemo(() => {
    if (!nights.length) return [];

    const byKey = new Map(nights.map((night) => [night.key, night]));
    const latest = nights[0].date;

    return Array.from({ length: window }, (_, offset) => {
      const date = subDays(latest, offset);
      const key = format(date, 'yyyy-MM-dd');
      return { key, date, night: byKey.get(key) ?? null };
    });
  }, [nights, window]);

  // Grouped so a long stack keeps its bearings while scrolling.
  const months = useMemo(() => {
    const groups: Array<{ id: string; label: string; rows: typeof rows }> = [];
    for (const row of rows) {
      const id = format(row.date, 'yyyy-MM');
      const last = groups[groups.length - 1];
      if (last?.id === id) last.rows.push(row);
      else groups.push({ id, label: format(row.date, 'MMMM yyyy'), rows: [row] });
    }
    return groups;
  }, [rows]);

  if (!rows.length) return null;

  return (
    <div>
      <HourAxis />

      <div className="space-y-4">
        {months.map((month) => (
          <section key={month.id}>
            <h2 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {month.label}
            </h2>
            <div className="space-y-[3px]">
              {month.rows.map((row) => (
                <NightRow
                  key={row.key}
                  date={row.date}
                  night={row.night}
                  sun={sunTimes(row.date, place)}
                  guides={guides}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

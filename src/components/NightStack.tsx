import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Night } from '@/lib/sleep';
import { HourAxis } from './HourAxis';
import { NightRow } from './NightRow';

interface NightStackProps {
  /** Newest first. */
  nights: Night[];
  guides: { bedtime: number | null; wake: number | null };
  /** How many of the most recent nights to draw. */
  window: number;
  /** Hour of day every bar's left edge represents. */
  axisStart: number;
}

/**
 * The nights that were actually tracked, newest at the top.
 *
 * Only those: a night with nothing recorded is not a night of no sleep, and
 * drawing it as an empty row says that it was. The date in the gutter is what
 * shows a gap, and it costs nothing to read.
 */
export function NightStack({ nights, guides, window, axisStart }: NightStackProps) {
  const rows = useMemo(() => nights.slice(0, window), [nights, window]);

  // Grouped so a long stack keeps its bearings while scrolling.
  const months = useMemo(() => {
    const groups: Array<{ id: string; label: string; rows: Night[] }> = [];
    for (const night of rows) {
      const id = format(night.date, 'yyyy-MM');
      const last = groups[groups.length - 1];
      if (last?.id === id) last.rows.push(night);
      else groups.push({ id, label: format(night.date, 'MMMM yyyy'), rows: [night] });
    }
    return groups;
  }, [rows]);

  if (!rows.length) return null;

  return (
    <div>
      <HourAxis axisStart={axisStart} />

      <div className="space-y-4">
        {months.map((month) => (
          <section key={month.id}>
            <h2 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {month.label}
            </h2>
            <div className="space-y-[3px]">
              {month.rows.map((night) => (
                <NightRow
                  key={night.key}
                  night={night}
                  guides={guides}
                  axisStart={axisStart}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

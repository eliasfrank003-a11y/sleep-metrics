import {
  AXIS_START,
  formatClock,
  formatDuration,
  wrapSegments,
  type SleepStats,
} from '@/lib/sleep';
import { sunTimes, type Place } from '@/lib/sun';
import { atHour, CHART_GRID } from './layout';
import { HourCuts } from './HourCuts';

interface RhythmStripProps {
  stats: SleepStats;
  place: Place;
  /** Which date's sun to draw. Today, in practice. */
  date: Date;
}

/**
 * The average night, on the same 24-hour axis as the stack below it, with the
 * day's sun stated underneath.
 *
 * Sharing the axis and the hour cuts with every night row is what makes it
 * comparable at a glance rather than another chart to decode.
 */
export function RhythmStrip({ stats, place, date }: RhythmStripProps) {
  const sun = sunTimes(date, place);

  // The mean window, wrapped exactly like a real night so it sits under the
  // stack's edges rather than beside them.
  const window =
    stats.bedtime && stats.wake
      ? wrapSegments(
          stats.bedtime.mean,
          (24 + stats.wake.mean - stats.bedtime.mean) % 24,
          AXIS_START,
        )
      : [];

  return (
    <section>
      <div className={CHART_GRID}>
        <div />
        <div
          className="relative h-7 overflow-hidden bg-sleep-track"
          role="img"
          aria-label={
            stats.bedtime && stats.wake
              ? `Average night ${formatClock(stats.bedtime.mean)} to ${formatClock(
                  stats.wake.mean,
                )}`
              : 'Not enough nights yet'
          }
        >
          {window.map((segment, index) => (
            <div
              key={index}
              className="absolute inset-y-0 bg-sleep"
              style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
            />
          ))}

          <HourCuts />
        </div>
        <div />
      </div>

      <div className={`${CHART_GRID} mt-1.5`}>
        <div />
        {/* Sunrise and sunset are stated rather than drawn. As a rule under the
            bar they were a second thing to decode, chopped into pieces by the
            hour cuts and explaining themselves to nobody. */}
        <p className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
          {sun.sunrise === null || sun.sunset === null ? (
            `${place.label}: ${sun.daylightHours >= 24 ? 'sun never sets' : 'sun never rises'}`
          ) : (
            <>
              {place.label}: <span className="text-daylight">↑</span> {formatClock(sun.sunrise)}
              <span className="mx-1 opacity-40">·</span>
              <span className="text-daylight">↓</span> {formatClock(sun.sunset)}
              <span className="mx-1 opacity-40">·</span>
              {/* The two arrows already say what the span is; spelling out
                  "daylight" only pushed the line past the edge of the bar. */}
              {formatDuration(sun.daylightHours)}
            </>
          )}
        </p>
        <div />
      </div>
    </section>
  );
}

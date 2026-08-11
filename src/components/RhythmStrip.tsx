import {
  alongAxis,
  darkSegments,
  formatClock,
  formatDuration,
  wrapSegments,
  type SleepStats,
} from '@/lib/sleep';
import { sunTimes, type Place } from '@/lib/sun';
import { atHour, CHART_GRID } from './layout';

interface RhythmStripProps {
  stats: SleepStats;
  place: Place;
  /** Which date's sun to draw. Today, in practice. */
  date: Date;
  /** Hour of day the strip's left edge represents. */
  axisStart: number;
}

/**
 * The average night laid over today's daylight, on the same 24-hour axis as the
 * stack below.
 *
 * This is the circadian question in one line: how far the sleep window has
 * drifted from the sun. Sharing the axis with every night row is what makes it
 * comparable at a glance rather than another chart to decode.
 */
export function RhythmStrip({ stats, place, date, axisStart }: RhythmStripProps) {
  const sun = sunTimes(date, place);
  const darkness = darkSegments(sun, axisStart);

  // The mean window, wrapped exactly like a real night so it sits under the
  // stack's edges rather than beside them.
  const window =
    stats.bedtime && stats.wake
      ? wrapSegments(
          stats.bedtime.mean,
          (24 + stats.wake.mean - stats.bedtime.mean) % 24,
          axisStart,
        )
      : [];

  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Rhythm
        </h2>
        <span className="text-[10px] text-muted-foreground">{place.label}</span>
      </div>

      <div className={CHART_GRID}>
        <div />
        <div
          className="relative h-7 overflow-hidden rounded-md bg-sleep-track"
          role="img"
          aria-label={
            stats.bedtime && stats.wake
              ? `Average night ${formatClock(stats.bedtime.mean)} to ${formatClock(
                  stats.wake.mean,
                )}; daylight ${sun.sunrise === null ? 'none' : formatClock(sun.sunrise)} to ${
                  sun.sunset === null ? 'none' : formatClock(sun.sunset)
                }`
              : 'Not enough nights yet'
          }
        >
          {/* Same wash as the stack, a shade stronger: this strip is where the
              sun is the subject rather than the background. */}
          {darkness.map((segment, index) => (
            <div
              key={index}
              className="absolute inset-y-0 bg-[hsl(var(--night-wash)/0.16)]"
              style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
            />
          ))}

          {sun.sunrise !== null && sun.sunset !== null && (
            <>
              <div
                className="absolute inset-y-0 w-px bg-[hsl(var(--daylight)/0.9)]"
                style={{ left: atHour(alongAxis(sun.sunrise, axisStart)) }}
              />
              <div
                className="absolute inset-y-0 w-px bg-[hsl(var(--daylight)/0.9)]"
                style={{ left: atHour(alongAxis(sun.sunset, axisStart)) }}
              />
            </>
          )}

          {/* Inset rather than full height: this is the average, not a night,
              and it should not be mistaken for a row of the stack. */}
          {window.map((segment, index) => (
            <div
              key={index}
              className="absolute inset-y-[7px] rounded-[2px] bg-sleep"
              style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
            />
          ))}
        </div>
        <div />
      </div>

      <div className={`${CHART_GRID} mt-1.5`}>
        <div />
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {sun.sunrise === null || sun.sunset === null ? (
            sun.daylightHours >= 24 ? (
              'Sun never sets'
            ) : (
              'Sun never rises'
            )
          ) : (
            <>
              <span className="text-daylight">↑</span> {formatClock(sun.sunrise)}
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-daylight">↓</span> {formatClock(sun.sunset)}
              <span className="mx-1.5 opacity-40">·</span>
              {formatDuration(sun.daylightHours)} light
              {stats.midpoint && (
                <>
                  <span className="mx-1.5 opacity-40">·</span>
                  mid {formatClock(stats.midpoint.mean)}
                </>
              )}
            </>
          )}
        </p>
        <div />
      </div>
    </section>
  );
}

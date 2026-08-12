import {
  formatClock,
  formatDuration,
  lightSegments,
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
  /** Hour of day the strip's left edge represents. */
  axisStart: number;
}

/**
 * The average night laid over today's daylight, on the same 24-hour axis as the
 * stack below.
 *
 * This is the circadian question in one line: how far the sleep window has
 * drifted from the sun. Sharing the axis - and the hour cuts - with every night
 * row is what makes it comparable at a glance rather than another chart to
 * decode.
 */
export function RhythmStrip({ stats, place, date, axisStart }: RhythmStripProps) {
  const sun = sunTimes(date, place);
  const daylight = lightSegments(sun, axisStart);

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
          {/* Full height, like a night row: an inset bar left a gap top and
              bottom that read as an unfinished edge rather than as a distinction
              worth making. */}
          {window.map((segment, index) => (
            <div
              key={index}
              className="absolute inset-y-0 bg-sleep"
              style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
            />
          ))}

          {/* Daylight as a rule along the bottom rather than a wash behind
              everything. A tint over the whole span turned the strip olive and
              blurred the very hour cells the bar exists to make countable; a
              rule states the same thing and stays out of the way. */}
          {daylight.map((segment, index) => (
            <div
              key={`light-${index}`}
              className="absolute bottom-0 h-[3px] bg-[hsl(var(--daylight)/0.75)]"
              style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
            />
          ))}

          <HourCuts />
        </div>
        <div />
      </div>

      <div className={`${CHART_GRID} mt-1.5`}>
        <div />
        {/* Kept to one line: it sits directly under the strip and reads as its
            caption, and a caption that wraps stops looking like one. */}
        <p className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
          {sun.sunrise === null || sun.sunset === null ? (
            `${place.label} (${sun.daylightHours >= 24 ? 'sun never sets' : 'sun never rises'})`
          ) : (
            <>
              {place.label} (<span className="text-daylight">↑</span> {formatClock(sun.sunrise)}
              <span className="mx-1 opacity-40">·</span>
              <span className="text-daylight">↓</span> {formatClock(sun.sunset)}
              <span className="mx-1 opacity-40">·</span>
              {formatDuration(sun.daylightHours)}
              {stats.midpoint && (
                <>
                  <span className="mx-1 opacity-40">·</span>
                  mid {formatClock(stats.midpoint.mean)}
                </>
              )}
              )
            </>
          )}
        </p>
        <div />
      </div>
    </section>
  );
}

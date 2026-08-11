import { format } from 'date-fns';
import { darkSegments, formatClock, formatDuration, type Night } from '@/lib/sleep';
import type { SunTimes } from '@/lib/sun';
import { atHour, CHART_GRID } from './layout';

interface NightRowProps {
  date: Date;
  /** Null for a night with nothing tracked - the row is still drawn, empty. */
  night: Night | null;
  /** Sunrise and sunset for this date, washed in behind the bar. */
  sun: SunTimes;
  /** Average bedtime and wake across the whole stack, drawn as guides. */
  guides: { bedtime: number | null; wake: number | null };
}

/** One tick per hour, with a heavier one every six. Two gradients, not 28 nodes. */
const HOUR_TICKS = {
  backgroundImage: [
    `repeating-linear-gradient(to right, hsl(var(--grid-major)) 0 1px, transparent 1px ${100 / 4}%)`,
    `repeating-linear-gradient(to right, hsl(var(--grid-hour)) 0 1px, transparent 1px ${100 / 24}%)`,
  ].join(','),
};

export function NightRow({ date, night, sun, guides }: NightRowProps) {
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const darkness = darkSegments(sun);

  const label = night
    ? `${format(date, 'd MMMM')}: asleep ${formatClock(night.bedtime)} to ${formatClock(
        night.wake,
      )}, ${formatDuration(night.hours)}`
    : `${format(date, 'd MMMM')}: nothing tracked`;

  return (
    <div className={CHART_GRID}>
      <span
        className={`text-right text-[10px] tabular-nums ${
          weekend ? 'text-foreground/70' : 'text-muted-foreground'
        }`}
      >
        {format(date, 'd')}
      </span>

      <div
        className="relative h-4 overflow-hidden rounded-[3px] bg-sleep-track"
        style={HOUR_TICKS}
        role="img"
        aria-label={label}
      >
        {/* Darkness, behind everything, wrapped the same way the night is.
            Painting the dark rather than the daylight is the more useful of the
            two: the question this chart answers is whether the sleep sits inside
            the dark window, and here the answer is two shapes lining up. */}
        {darkness.map((segment, index) => (
          <div
            key={`dark-${index}`}
            className="absolute inset-y-0 bg-[hsl(var(--night-wash)/0.1)]"
            style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
          />
        ))}

        {night?.segments.map((segment, index) => (
          <div
            key={index}
            className="absolute inset-y-0 bg-sleep"
            style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
          />
        ))}

        {/* The two moments the whole chart exists to compare. Brightened so the
            eye can run down the stack and catch a night that started late. */}
        {night && (
          <>
            <div
              className="absolute inset-y-0 w-[2px] bg-sleep-edge"
              style={{ left: `calc(${atHour(night.bedtime)} - 1px)` }}
            />
            <div
              className="absolute inset-y-0 w-[2px] bg-sleep-edge"
              style={{ left: `calc(${atHour(night.wake)} - 1px)` }}
            />
          </>
        )}

        {/* Drawn last, so the average stays readable where it crosses a bar. */}
        {guides.bedtime !== null && (
          <div
            className="absolute inset-y-0 w-px bg-[hsl(var(--guide)/0.5)]"
            style={{ left: atHour(guides.bedtime) }}
          />
        )}
        {guides.wake !== null && (
          <div
            className="absolute inset-y-0 w-px bg-[hsl(var(--guide)/0.5)]"
            style={{ left: atHour(guides.wake) }}
          />
        )}
      </div>

      <span className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
        {night ? formatDuration(night.hours) : ''}
      </span>
    </div>
  );
}

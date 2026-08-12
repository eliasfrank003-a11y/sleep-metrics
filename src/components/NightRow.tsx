import { useMemo } from 'react';
import { format } from 'date-fns';
import { alongAxis, formatClock, formatDuration, segmentsFor, type Night } from '@/lib/sleep';
import { atHour, CHART_GRID } from './layout';
import { HourCuts } from './HourCuts';

interface NightRowProps {
  night: Night;
  /** Average bedtime and wake across the stack, drawn as guides. */
  guides: { bedtime: number | null; wake: number | null };
  /** Hour of day the bar's left edge represents. */
  axisStart: number;
}

/** A dashed vertical, so an average never reads as one of the hour cuts. */
const DASH = {
  backgroundImage: `linear-gradient(to bottom, hsl(var(--guide)) 0 2px, transparent 2px 4px)`,
};

export function NightRow({ night, guides, axisStart }: NightRowProps) {
  const weekend = night.date.getDay() === 0 || night.date.getDay() === 6;
  const segments = useMemo(() => segmentsFor(night, axisStart), [night, axisStart]);

  return (
    <div className={CHART_GRID}>
      <span
        className={`text-right text-[10px] tabular-nums ${
          weekend ? 'text-foreground/70' : 'text-muted-foreground'
        }`}
      >
        {format(night.date, 'd')}
      </span>

      <div
        className="relative h-4 overflow-hidden bg-sleep-track"
        role="img"
        aria-label={`${format(night.date, 'd MMMM')}: asleep ${formatClock(
          night.bedtime,
        )} to ${formatClock(night.wake)}, ${formatDuration(night.hours)}`}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className="absolute inset-y-0 bg-sleep"
            style={{ left: atHour(segment.from), width: atHour(segment.to - segment.from) }}
          />
        ))}

        <HourCuts />

        {guides.bedtime !== null && (
          <div
            className="absolute inset-y-0 w-px opacity-60"
            style={{ ...DASH, left: atHour(alongAxis(guides.bedtime, axisStart)) }}
          />
        )}
        {guides.wake !== null && (
          <div
            className="absolute inset-y-0 w-px opacity-60"
            style={{ ...DASH, left: atHour(alongAxis(guides.wake, axisStart)) }}
          />
        )}
      </div>

      <span className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
        {formatDuration(night.hours)}
      </span>
    </div>
  );
}

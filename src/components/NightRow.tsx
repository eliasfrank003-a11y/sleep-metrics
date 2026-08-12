import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  AXIS_START,
  formatClock,
  formatCompact,
  formatDuration,
  segmentsFor,
  type Night,
} from '@/lib/sleep';
import { atHour, CHART_GRID } from './layout';
import { HourCuts } from './HourCuts';

export function NightRow({ night }: { night: Night }) {
  const weekend = night.date.getDay() === 0 || night.date.getDay() === 6;
  const segments = useMemo(() => segmentsFor(night, AXIS_START), [night]);

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
      </div>

      <span className="whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">
        {formatCompact(night.hours)}
      </span>
    </div>
  );
}

import { AXIS_START } from '@/lib/sleep';
import { atHour, CHART_GRID } from './layout';

/** Labelled every three hours; the bars themselves carry a cut for all 24. */
const LABELLED = [0, 3, 6, 9, 12, 15, 18, 21, 24];

/**
 * Sticks to the top of the scroll container, so however far down the stack you
 * are the edge of a bar can still be read off against a time.
 */
export function HourAxis() {
  return (
    <div className={`${CHART_GRID} sticky top-0 z-10 bg-background pb-1.5 pt-2`}>
      <div />
      <div className="relative h-3" aria-hidden="true">
        {LABELLED.map((hour) => (
          <span
            key={hour}
            className="absolute top-0 text-[9px] font-medium tabular-nums tracking-tight text-muted-foreground"
            style={{
              left: atHour(hour),
              // The end labels would otherwise hang off the chart; only the
              // interior ones can be centred on their tick.
              transform:
                hour === 0 ? 'none' : hour === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {String((hour + AXIS_START) % 24).padStart(2, '0')}
          </span>
        ))}
      </div>
      <div />
    </div>
  );
}

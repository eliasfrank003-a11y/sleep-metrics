import {
  formatClock,
  formatDeviation,
  formatDuration,
  type SleepStats as Stats,
} from '@/lib/sleep';

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-card px-2 py-3 text-center">
      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 text-[17px] font-medium tabular-nums leading-none">{value}</div>
      <div className="mt-1.5 text-[10px] tabular-nums text-muted-foreground">{hint}</div>
    </div>
  );
}

/**
 * The three numbers worth knowing, each with its spread underneath.
 *
 * A mean bedtime on its own says almost nothing - 22:00 every night and a coin
 * flip between 20:00 and midnight both average to 22:00. The deviation is the
 * number that actually moves when the routine holds, so it is never more than a
 * glance away from the average it qualifies.
 */
export function SleepStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile
        label="Asleep"
        value={formatDuration(stats.averageHours)}
        hint={`${stats.nights} night${stats.nights === 1 ? '' : 's'}`}
      />
      <Tile
        label="To bed"
        value={stats.bedtime ? formatClock(stats.bedtime.mean) : '—'}
        hint={stats.bedtime ? formatDeviation(stats.bedtime.deviationMinutes) : ''}
      />
      <Tile
        label="Awake"
        value={stats.wake ? formatClock(stats.wake.mean) : '—'}
        hint={stats.wake ? formatDeviation(stats.wake.deviationMinutes) : ''}
      />
    </div>
  );
}

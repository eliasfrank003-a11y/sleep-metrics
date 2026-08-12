import { RefreshCw, Settings } from 'lucide-react';
import type { Night, SleepStats as Stats } from '@/lib/sleep';
import type { Place } from '@/lib/sun';
import type { AxisStart } from '@/hooks/useAxisStart';
import type { NightWindow } from '@/hooks/useNightWindow';
import { NightStack } from './NightStack';
import { RhythmStrip } from './RhythmStrip';
import { SleepStats } from './SleepStats';

interface SleepViewProps {
  nights: Night[];
  stats: Stats;
  place: Place;
  window: NightWindow;
  axisStart: AxisStart;
  /** Set when the last load failed; shown instead of the empty-state copy. */
  notice: string | null;
  onOpenSettings: () => void;
  onSync: () => void;
  syncing: boolean;
  syncEnabled: boolean;
}

export function SleepView({
  nights,
  stats,
  place,
  window,
  axisStart,
  notice,
  onOpenSettings,
  onSync,
  syncing,
  syncEnabled,
}: SleepViewProps) {
  return (
    <div className="px-5 pb-20 pt-8">
      <header className="mb-7 flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Sleep</h1>
        <div className="flex items-center gap-4">
          {syncEnabled && (
            <button
              onClick={onSync}
              disabled={syncing}
              aria-label="Sync calendar now"
              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {nights.length === 0 ? (
        <div className="rounded-xl bg-card px-5 py-8 text-center">
          <p className={`text-sm ${notice ? 'text-destructive' : 'text-muted-foreground'}`}>
            {notice ? 'Could not reach the database.' : 'No nights yet.'}
          </p>
          <p className="mx-auto mt-2 max-w-[19rem] text-xs leading-relaxed text-muted-foreground">
            {notice ??
              'Start the Sleep task in the tracker when you go to bed and stop it when you get up. The night appears here within half a minute of the calendar entry being written.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <SleepStats stats={stats} />
          </div>

          <div className="mb-7">
            <RhythmStrip stats={stats} place={place} date={new Date()} axisStart={axisStart} />
          </div>

          <NightStack
            nights={nights}
            window={window}
            axisStart={axisStart}
            guides={{
              bedtime: stats.bedtime?.mean ?? null,
              wake: stats.wake?.mean ?? null,
            }}
          />
        </>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { buildNights, centredAxisStart, summarise } from '@/lib/sleep';
import { useSleep } from '@/hooks/useSleep';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useNightWindow } from '@/hooks/useNightWindow';
import { usePlace } from '@/hooks/usePlace';
import { SleepView } from '@/components/SleepView';
import { SettingsPanel } from '@/components/SettingsPanel';

export default function App() {
  const { sessions, isLoading, error, refetch } = useSleep();
  const { state: syncState, error: syncError, sync, enabled: syncEnabled } = useCalendarSync(refetch);
  const { place, setPlace } = usePlace();
  const { window, setWindow } = useNightWindow();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const nights = useMemo(() => buildNights(sessions), [sessions]);

  // Averaged over the nights on screen, not over everything ever recorded: the
  // guides drawn down the stack have to describe the stack you are looking at.
  const stats = useMemo(() => summarise(nights.slice(0, window)), [nights, window]);

  // Derived from the nights rather than chosen: the bar is centred on whatever
  // the middle of your night actually is, so going to bed early and going to bed
  // late are drawn as equal and opposite rather than one of them jumping the
  // full width of the chart.
  const axisStart = useMemo(() => centredAxisStart(stats.midpoint), [stats.midpoint]);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-md">
        <SleepView
          nights={nights}
          stats={stats}
          place={place}
          window={window}
          axisStart={axisStart}
          // A failed load replaces the empty state's copy rather than the whole
          // screen: on a phone that means a dropped connection shows the app
          // with a note, not a stack trace where the chart should be.
          notice={error}
          onOpenSettings={() => setSettingsOpen(true)}
          onSync={sync}
          syncing={syncState === 'running'}
          syncEnabled={syncEnabled}
        />
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        place={place}
        onSelectPlace={setPlace}
        window={window}
        onSelectWindow={setWindow}
        syncError={syncError}
      />
    </div>
  );
}

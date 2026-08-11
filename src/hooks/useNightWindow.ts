import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sleep-metrics:window';

/** How many nights the stack draws, counting back from the latest tracked one. */
export const WINDOWS = [30, 60, 90, 180] as const;

export type NightWindow = (typeof WINDOWS)[number];

const DEFAULT: NightWindow = 60;

function initial(): NightWindow {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return (WINDOWS as readonly number[]).includes(stored) ? (stored as NightWindow) : DEFAULT;
}

export function useNightWindow() {
  const [window, setWindowState] = useState<NightWindow>(initial);

  const setWindow = useCallback((next: NightWindow) => {
    setWindowState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return { window, setWindow };
}

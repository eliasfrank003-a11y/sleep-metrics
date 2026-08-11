import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sleep-metrics:axis-start';

/**
 * The hour the 24-hour bar begins and ends at.
 *
 * Set to the usual bedtime, every night starts hard against the left edge and
 * the stack reads as one straight line. The cost is at the other end of that
 * edge: a night that begins even ten minutes *early* falls on the far right
 * instead, and a small deviation is drawn as the largest one possible. Choosing
 * an hour or two earlier than the real bedtime trades a fixed indent for never
 * seeing that happen.
 */
export const AXIS_STARTS = [18, 20, 21, 22] as const;

export type AxisStart = (typeof AXIS_STARTS)[number];

const DEFAULT: AxisStart = 22;

function initial(): AxisStart {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return (AXIS_STARTS as readonly number[]).includes(stored) ? (stored as AxisStart) : DEFAULT;
}

export function useAxisStart() {
  const [axisStart, setAxisStartState] = useState<AxisStart>(initial);

  const setAxisStart = useCallback((next: AxisStart) => {
    setAxisStartState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return { axisStart, setAxisStart };
}

/**
 * The one grid the hour axis and every night row share.
 *
 * Both use it verbatim, which is what guarantees that a tick labelled 06 in the
 * header sits exactly above 06:00 in the bars. The whole point of the chart is
 * reading a straight vertical line down the stack, so a half-pixel of drift
 * between header and rows would be the worst kind of bug: invisible, and wrong.
 */
export const CHART_GRID = 'grid grid-cols-[1.375rem_1fr_2.875rem] items-center gap-2';

/** Percentage across the 24-hour bar for an hour of day. */
export function atHour(hour: number): string {
  return `${(hour / 24) * 100}%`;
}

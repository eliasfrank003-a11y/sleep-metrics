/**
 * The 24 hour divisions of a bar, painted *over* everything else in it.
 *
 * Behind the fill they were decoration; over it they make a night countable.
 * Eight hours asleep is eight cells you can count, rather than a red rectangle
 * whose length has to be measured against a scale somewhere else on screen.
 *
 * The cuts are drawn in the page background so they read as gaps rather than as
 * a third colour, and every third one is doubled so the bar groups into eights
 * that line up with the labels on the axis.
 */
export function HourCuts() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage: [
          `repeating-linear-gradient(to right, hsl(var(--background)) 0 2px, transparent 2px calc(100% / 8))`,
          `repeating-linear-gradient(to right, hsl(var(--background)) 0 1px, transparent 1px calc(100% / 24))`,
        ].join(','),
      }}
    />
  );
}

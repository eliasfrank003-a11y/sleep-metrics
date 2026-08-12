/**
 * The 24 hour divisions of a bar, painted *over* everything else in it.
 *
 * Behind the fill they were decoration; over it they make a night countable.
 * Eight hours asleep is eight cells you can count, rather than a red rectangle
 * whose length has to be measured against a scale somewhere else on screen.
 *
 * The cuts are drawn in the page background so they read as gaps rather than as
 * a third colour. All 24 are identical: an emphasised one every third hour gave
 * the row two competing rhythms, and the eye counted the heavy ones instead of
 * the cells.
 */
export function HourCuts() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, hsl(var(--background)) 0 1px, transparent 1px calc(100% / 24))`,
      }}
    />
  );
}

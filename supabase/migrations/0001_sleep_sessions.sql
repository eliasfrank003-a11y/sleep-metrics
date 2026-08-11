-- Sleep Metrics: one row per tracked sleep event.
--
-- The calendar is the source of truth. Nothing is written here by hand, so the
-- table is deliberately thin: two timestamps, the night they belong to, and the
-- Google event id that makes a re-sync idempotent.

CREATE TABLE IF NOT EXISTS public.sleep_sessions (
  id          SERIAL PRIMARY KEY,
  -- Google Calendar event id. Unique, so syncing the same event twice updates
  -- rather than duplicates.
  external_id TEXT        NOT NULL UNIQUE,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ NOT NULL,
  -- The night this counts toward, named after the evening it began: a session
  -- starting at 01:30 is filed under the previous day. Stored rather than
  -- derived so the grouping can't drift with the reader's timezone.
  night_of    DATE        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sleep_sessions_ordered CHECK (ended_at > started_at)
);

CREATE INDEX IF NOT EXISTS sleep_sessions_night_idx
  ON public.sleep_sessions (night_of DESC);

ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

-- Single-user app with no auth, matching musical-metrics and movement-metrics.
-- If this ever gains a second user, these must be replaced with auth.uid()
-- checks. Writes only ever come from the edge function, which uses the service
-- role key and bypasses these anyway - but an insert policy keeps the table
-- usable from the dashboard without disabling RLS.
DROP POLICY IF EXISTS "public read sleep"   ON public.sleep_sessions;
DROP POLICY IF EXISTS "public insert sleep" ON public.sleep_sessions;
DROP POLICY IF EXISTS "public update sleep" ON public.sleep_sessions;
DROP POLICY IF EXISTS "public delete sleep" ON public.sleep_sessions;

CREATE POLICY "public read sleep"   ON public.sleep_sessions FOR SELECT USING (true);
CREATE POLICY "public insert sleep" ON public.sleep_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update sleep" ON public.sleep_sessions FOR UPDATE USING (true);
CREATE POLICY "public delete sleep" ON public.sleep_sessions FOR DELETE USING (true);

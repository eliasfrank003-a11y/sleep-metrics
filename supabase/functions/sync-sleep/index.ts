import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, getAccessToken, json, readServiceAccount } from "../_shared/google.ts";

interface CalendarEvent {
  id: string;
  summary?: string;
  status?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

/** How far back to reconcile on each run. */
const DEFAULT_WINDOW_DAYS = 180;

/**
 * The timezone nights are filed in.
 *
 * Fixed rather than taken from the request: the same event must land on the
 * same night whichever device asks, and the phone in a different timezone on
 * holiday should not silently re-file six months of history.
 */
const TIMEZONE = "Europe/Amsterdam";

/**
 * Wall-clock parts of an instant in TIMEZONE.
 *
 * Built from parts with an explicit h23 cycle rather than a formatted string:
 * `hour12: false` resolves to h24 in several locales, which renders midnight as
 * "24" - and a 24 would push every after-midnight bedtime onto the wrong night.
 */
function localParts(iso: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const part = (type: string) => parts.find((p) => p.type === type)!.value;

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  };
}

/**
 * The night a session is filed under, named after the evening it began.
 *
 * Midday is the split: it is the point furthest from when anyone sleeps, so a
 * bedtime drifting from 21:00 to 03:00 never crosses it and a night never jumps
 * rows just because it ran late. Mirrors `nightOf` in the client.
 */
function nightOf(startIso: string): string {
  const { date, hour } = localParts(startIso);
  if (hour >= 12) return date;
  const previous = new Date(`${date}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const calendarId = Deno.env.get("GOOGLE_SLEEP_CALENDAR_ID");
    if (!calendarId) {
      return json({ error: "Server configuration error: missing GOOGLE_SLEEP_CALENDAR_ID" }, 500);
    }

    const accessToken = await getAccessToken(readServiceAccount());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Reconcile a rolling window rather than tracking a cursor. Re-running is
    // then always safe: the same events produce the same rows.
    const windowDays = Number(new URL(req.url).searchParams.get("days")) || DEFAULT_WINDOW_DAYS;
    const timeMin = new Date(Date.now() - windowDays * 86_400_000).toISOString();

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", new Date(Date.now() + 86_400_000).toISOString());
    url.searchParams.set("singleEvents", "true"); // expands any repeating event
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "2500");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Calendar read failed (${response.status}): ${await response.text()}`);
    }

    const events: CalendarEvent[] = (await response.json()).items ?? [];

    const rows = events
      // All-day entries carry no times, so there is no night to draw from them.
      .filter((e) => e.status !== "cancelled" && e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        external_id: e.id,
        started_at: e.start.dateTime!,
        ended_at: e.end.dateTime!,
        night_of: nightOf(e.start.dateTime!),
      }))
      // A tracker stopped in the same minute it started leaves a zero-length
      // event; the table's CHECK would reject it anyway.
      .filter((r) => new Date(r.ended_at) > new Date(r.started_at));

    // Reconciliation runs both ways: an event deleted in the calendar must lose
    // its row here too, or a mistimed night stays on the chart forever.
    const windowStart = timeMin.slice(0, 10);
    const { data: existing, error: existingError } = await supabase
      .from("sleep_sessions")
      .select("id, external_id, started_at, ended_at, night_of")
      .gte("night_of", windowStart);

    if (existingError) throw new Error(`Failed to load existing rows: ${existingError.message}`);

    const keep = new Set(rows.map((r) => r.external_id));
    const stale = (existing ?? []).filter((row) => !keep.has(row.external_id));

    if (stale.length) {
      const { error } = await supabase
        .from("sleep_sessions")
        .delete()
        .in("id", stale.map((row) => row.id));
      if (error) throw new Error(`Delete failed: ${error.message}`);
    }

    // Writing only what actually moved keeps the counts honest, which is what
    // the client uses to decide whether to re-render. An unconditional upsert
    // would report every row as updated on every poll.
    const byId = new Map((existing ?? []).map((row) => [row.external_id, row]));
    const changed = rows.filter((row) => {
      const before = byId.get(row.external_id);
      if (!before) return true;
      return (
        new Date(before.started_at).getTime() !== new Date(row.started_at).getTime() ||
        new Date(before.ended_at).getTime() !== new Date(row.ended_at).getTime() ||
        before.night_of !== row.night_of
      );
    });

    if (changed.length) {
      const { error } = await supabase
        .from("sleep_sessions")
        .upsert(changed, { onConflict: "external_id" });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
    }

    const created = changed.filter((row) => !byId.has(row.external_id)).length;
    const updated = changed.length - created;

    console.log(
      `[sync-sleep] ${events.length} events -> ${created} new, ${updated} updated, ${stale.length} removed`,
    );

    return json({ events: events.length, created, updated, removed: stale.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-sleep]", message);
    return json({ error: message }, 500);
  }
});

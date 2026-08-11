# Sleep Metrics

Every night on one 24-hour bar, stacked, so a routine holding — or slipping — is
visible without reading a single number.

The bar runs midnight to midnight. A night that starts at 22:00 fills the last
two hours on the right and continues from the left edge, which puts bedtime and
wake-up at fixed horizontal positions: go to bed at the same time every night and
their edges line up into a straight vertical. An hour late shows as a notch.

Dashed verticals mark the average bedtime and wake time across the nights on
screen, and a faint warm wash behind each row is that date's daylight — the
circadian reference the sleep window drifts against.

## Where the data comes from

A tracker task on the phone writes an event to a Google Calendar called **Sleep**.
Nothing is entered in this app by hand.

```
tracker → Google Calendar → sync-sleep (edge function) → sleep_sessions → app
```

`sync-sleep` reconciles a rolling 180-day window on every run: events that
changed are updated, events deleted from the calendar lose their row. Re-running
it is always safe. The client polls it every 30 seconds while the tab is visible.

Both this app and movement-metrics live in the same Supabase project and share
one Google service account. A calendar becomes readable by being shared with
that account's address, and its id then goes into the `GOOGLE_SLEEP_CALENDAR_ID`
secret.

`google-identity` is a setup helper that prints that address along with every
calendar the account can currently see. It is deliberately left undeployed —
it answers to anyone who calls it — so deploy it when wiring up a new calendar
and delete it again afterwards:

```bash
supabase functions deploy google-identity --no-verify-jwt
supabase functions delete google-identity
```

## Running it

```bash
npm install
npm run dev
```

`.env` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`).
To work on the chart without a database behind it:

```bash
VITE_DEMO=1 npm run dev
```

which seeds a seeded-random ten weeks of plausible nights.

## Deploying

Pushing to `main` builds and publishes to GitHub Pages. The two `VITE_` values
above have to exist as repository secrets — the build inlines them.

## Schema

One table, `sleep_sessions`: a Google event id, a start, an end, and the night it
counts toward. Nights are named after the evening they began, split at midday —
the point furthest from when anyone sleeps, so a bedtime drifting from 21:00 to
03:00 never jumps to a different row.

import { corsHeaders, getAccessToken, json, readServiceAccount } from "../_shared/google.ts";

/**
 * Setup helper, not part of the running app.
 *
 * Answers the two questions that block wiring up a new calendar: which identity
 * must the calendar be shared with, and what is the id of a calendar once it
 * has been. Returns the service account's email address - its public identity,
 * never the key - and every calendar currently visible to it.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const account = readServiceAccount();
    const token = await getAccessToken(account);

    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Calendar list failed (${response.status}): ${await response.text()}`);
    }

    const items: Array<{ id: string; summary?: string; accessRole?: string }> =
      (await response.json()).items ?? [];

    return json({
      shareCalendarsWith: account.client_email,
      calendars: items.map((c) => ({ id: c.id, name: c.summary, access: c.accessRole })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[google-identity]", message);
    return json({ error: message }, 500);
  }
});

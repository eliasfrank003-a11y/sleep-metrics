/**
 * Google service-account auth, shared by the functions in this project.
 *
 * The same service account that already backs movement-metrics is reused here,
 * so a calendar only has to be shared with one identity to become readable.
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const base64Url = (bytes: Uint8Array | string): string => {
  const raw = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export function readServiceAccount(): ServiceAccount {
  const json = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!json) throw new Error("Server configuration error: missing GOOGLE_SERVICE_ACCOUNT_JSON");
  return JSON.parse(json) as ServiceAccount;
}

/** Signs a JWT with the service account key and trades it for an access token. */
export async function getAccessToken(
  account: ServiceAccount,
  scope = "https://www.googleapis.com/auth/calendar.readonly",
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const unsigned = [
    base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64Url(
      JSON.stringify({
        iss: account.client_email,
        scope,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ),
  ].join(".");

  const pem = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64Url(new Uint8Array(signature))}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()).access_token as string;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

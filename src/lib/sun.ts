/**
 * Sunrise and sunset, computed locally.
 *
 * The NOAA general solar position equations, accurate to roughly a minute at
 * these latitudes - far past what a bar 400px wide can show. Doing it in the
 * client keeps the app offline-capable and avoids a second API to keep alive.
 */

/** A place on Earth, and the label shown for it. */
export interface Place {
  label: string;
  lat: number;
  lon: number;
}

/** Where the sun sits for one date. Null when the sun never crosses the horizon. */
export interface SunTimes {
  /** Local hour of day, 0-24, fractional. */
  sunrise: number | null;
  sunset: number | null;
  /** Hours of daylight, 0 on a polar night and 24 on a polar day. */
  daylightHours: number;
}

const DEG = Math.PI / 180;

/** The standard refraction-corrected solar zenith for sunrise/sunset. */
const ZENITH = 90.833;

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Minutes past UTC midnight for sunrise and sunset, or null when the hour angle
 * has no solution - which is exactly the polar day/night case.
 */
function solarMinutesUtc(date: Date, lat: number, lon: number) {
  // Fractional year, taken at local noon so the equation-of-time term is
  // evaluated near the event rather than at the start of the day.
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1 + 0.5);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const cosHourAngle =
    Math.cos(ZENITH * DEG) / (Math.cos(lat * DEG) * Math.cos(decl)) -
    Math.tan(lat * DEG) * Math.tan(decl);

  if (cosHourAngle > 1) return { polar: 'night' as const };
  if (cosHourAngle < -1) return { polar: 'day' as const };

  const hourAngle = Math.acos(cosHourAngle) / DEG;
  return {
    sunrise: 720 - 4 * (lon + hourAngle) - eqTime,
    sunset: 720 - 4 * (lon - hourAngle) - eqTime,
  };
}

/**
 * Converts minutes past UTC midnight on `date` into a local hour of day.
 * Going through a Date rather than a fixed offset keeps this correct across the
 * DST boundary, where the offset differs either side of the same night.
 */
function localHour(date: Date, utcMinutes: number): number {
  const at = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + utcMinutes * 60_000,
  );
  return at.getHours() + at.getMinutes() / 60 + at.getSeconds() / 3600;
}

export function sunTimes(date: Date, place: Place): SunTimes {
  const solar = solarMinutesUtc(date, place.lat, place.lon);

  if ('polar' in solar) {
    return {
      sunrise: null,
      sunset: null,
      daylightHours: solar.polar === 'day' ? 24 : 0,
    };
  }

  const sunrise = localHour(date, solar.sunrise);
  const sunset = localHour(date, solar.sunset);

  // Measured from the UTC minutes, not the wrapped local hours: near the poles
  // sunset can land on the following local day, and 21.5 - 3.0 would then be
  // the wrong way round.
  const daylightHours = (solar.sunset - solar.sunrise) / 60;

  return { sunrise, sunset, daylightHours };
}

/**
 * The places actually lived in, so the common case needs no coordinates typed.
 *
 * Town-centre coordinates are plenty: a degree of longitude moves sunrise by
 * four minutes, and the bar is a few hundred pixels wide.
 */
export const PLACES: Place[] = [
  { label: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { label: 'Maastricht', lat: 50.8514, lon: 5.691 },
  // Weilheim in Oberbayern, 82362.
  { label: 'Weilheim', lat: 47.8412, lon: 11.1543 },
  // Weingarten (Württemberg), near Ravensburg - not the Baden one near Karlsruhe.
  { label: 'Weingarten', lat: 47.8093, lon: 9.6383 },
  { label: 'Berlin', lat: 52.52, lon: 13.405 },
  { label: 'Zürich', lat: 47.3769, lon: 8.5417 },
  { label: 'London', lat: 51.5072, lon: -0.1276 },
  { label: 'New York', lat: 40.7128, lon: -74.006 },
];

export const DEFAULT_PLACE = PLACES[0];

import { useCallback, useState } from 'react';
import { DEFAULT_PLACE, type Place } from '@/lib/sun';

const STORAGE_KEY = 'sleep-metrics:place';

/**
 * Where sunrise and sunset are computed for. Kept in localStorage rather than
 * the database: it is a property of where you are reading the app, not of the
 * data, and it changes about once a year.
 */
function initial(): Place {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PLACE;
    const parsed = JSON.parse(stored) as Partial<Place>;
    if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') return DEFAULT_PLACE;
    return { label: parsed.label ?? 'Custom', lat: parsed.lat, lon: parsed.lon };
  } catch {
    return DEFAULT_PLACE;
  }
}

export function usePlace() {
  const [place, setPlaceState] = useState<Place>(initial);

  const setPlace = useCallback((next: Place) => {
    setPlaceState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { place, setPlace };
}

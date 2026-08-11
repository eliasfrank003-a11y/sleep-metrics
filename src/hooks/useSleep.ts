import { useCallback, useEffect, useState } from 'react';
import { demoSessions } from '@/lib/store/demoData';
import { loadSessions, supabase } from '@/lib/store/supabaseStore';
import type { SleepSession } from '@/lib/types';

/** Set VITE_DEMO=1 to work on the chart without a database behind it. */
const DEMO = import.meta.env.VITE_DEMO === '1';

export function useSleep() {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (DEMO) {
      setSessions(demoSessions());
      setIsLoading(false);
      return;
    }
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setIsLoading(false);
      return;
    }
    try {
      setSessions(await loadSessions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sleep data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { sessions, isLoading, error, refetch };
}

import { createClient } from '@supabase/supabase-js';
import type { SleepSession } from '@/lib/types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null when the app is running without credentials, e.g. a bare `npm run dev`. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function loadSessions(): Promise<SleepSession[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('sleep_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SleepSession[];
}

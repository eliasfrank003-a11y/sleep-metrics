/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** '1' seeds the store with generated nights, for working on the chart offline. */
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

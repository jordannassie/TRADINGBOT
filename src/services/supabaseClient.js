// Browser-safe Supabase client (uses anon/public key only).
// Used exclusively for read operations in the /btc dashboard.
// Service role key is NEVER used here.
import { createClient } from '@supabase/supabase-js';

const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_URL = RAW_SUPABASE_URL.startsWith('http') ? RAW_SUPABASE_URL : '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!supabaseConfigured) {
  console.warn(
    '[supabaseClient] Supabase URL missing or invalid. ' +
    'Set VITE_SUPABASE_URL (https://...) and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(
  supabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  supabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder',
  {
    auth: { persistSession: false },
  },
);

export { supabaseConfigured };

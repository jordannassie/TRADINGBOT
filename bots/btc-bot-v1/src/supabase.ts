import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.\n' +
    'Copy .env.example to .env and fill in your values.',
  );
  process.exit(1);
}

export const supabase: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false },
});

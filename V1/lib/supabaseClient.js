'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Avoid throwing during import on platforms (like Vercel) where env vars
  // might not be set for preview builds. Log a clear warning so it's visible
  // in build/runtime logs and the app can handle the missing client.
  // Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
  // Vercel Project Settings -> Environment Variables and redeploy.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars not found: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export { supabase };

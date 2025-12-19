import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const adminKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !adminKey) {
  console.warn('Supabase admin client is missing configuration values.');
}

export const supabaseAdmin = supabaseUrl && adminKey
  ? createClient(supabaseUrl, adminKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const isUsingServiceRole = Boolean(serviceRoleKey);

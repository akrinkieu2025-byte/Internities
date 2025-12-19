import { NextResponse } from 'next/server';
import { supabaseAdmin, isUsingServiceRole } from '@/lib/supabaseAdmin';

const invalidResponse = (status = 200) => NextResponse.json({ valid: false }, { status });

export async function POST(request) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured.');
    return invalidResponse(500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('Invalid JSON body for verify-demo:', error);
    return invalidResponse(400);
  }

  const code = payload?.code?.trim();
  if (!code) {
    return invalidResponse(400);
  }

  const { data, error } = await supabaseAdmin
    .from('demo_codes')
    .select('code, used_count, max_uses')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.warn('Demo code lookup failed:', error?.message);
    return invalidResponse();
  }

  const hasReachedLimit = data.max_uses && (data.used_count ?? 0) >= data.max_uses;
  if (hasReachedLimit) {
    return invalidResponse();
  }

  try {
    await supabaseAdmin
      .from('demo_codes')
      .update({ used_count: (data.used_count ?? 0) + 1 })
      .eq('code', code);
  } catch (updateError) {
    if (isUsingServiceRole) {
      console.error('Failed to increment demo code usage:', updateError);
      return invalidResponse(500);
    }
    console.warn('Could not increment demo code usage with anon key:', updateError?.message);
  }

  const response = NextResponse.json({ valid: true });
  response.cookies.set('demo_access', 'true', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

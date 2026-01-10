'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      console.log('[company-login] Signing in company:', email);

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error('[company-login] Sign in error:', signInError);
        setError(signInError.message || 'Failed to sign in. Please try again.');
        setLoading(false);
        return;
      }

      const user = signInData?.user;

      if (!user) {
        setError('Sign in failed. No user returned.');
        setLoading(false);
        return;
      }

      console.log('[company-login] Signed in user:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[company-login] Profile fetch error:', profileError);
        setError('Could not load your profile. Please try again later.');
        setLoading(false);
        return;
      }

      if (!profile) {
        setError('No profile found for this account.');
        setLoading(false);
        return;
      }

      if (profile.role !== 'company') {
        console.warn('[company-login] User role is not company:', profile.role);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'company' })
          .eq('id', user.id);
        if (updateError) {
          console.error('[company-login] Profile role upgrade failed:', updateError);
          setError('This account is registered as student. Try company signup or contact support.');
          setLoading(false);
          return;
        }
      }

      // Ensure company + membership exists
      try {
        await fetchWithAuth('/api/company/bootstrap', { method: 'POST' }, supabase, signInData.session);
      } catch (e) {
        console.warn('[company-login] bootstrap failed', e);
      }

      console.log('[company-login] Company profile verified, redirecting to dashboard');
      setLoading(false);
      router.push('/company');
    } catch (err) {
      console.error('[company-login] Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-brand-light flex items-center justify-center pt-24 pb-12">
        <div className="w-full max-w-md px-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h1 className="text-3xl font-bold mb-2 text-white">Company Login</h1>
            <p className="text-brand-light/70 mb-6">
              Sign in to manage your internship postings and applications.
            </p>

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-light mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                  placeholder="company@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-light mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-blue"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

              <p className="text-center text-brand-light/70 mt-6">
              Don&apos;t have a company account?{' '}
              <Link
                href="/auth/company/signup"
                className="text-brand-primary hover:opacity-90 font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

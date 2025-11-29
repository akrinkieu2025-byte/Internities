'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [roleFromURL, setRoleFromURL] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r === 'company' || r === 'student') {
        setRoleFromURL(r);
      } else {
        setRoleFromURL(null);
      }
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      console.log('[login] Signing in', email);

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[login] signInError:', signInError);
        setError(signInError.message || 'Failed to sign in.');
        setLoading(false);
        return;
      }

      const user = signInData?.user ?? null;

      if (!user) {
        console.warn('[login] No user returned after signInWithPassword. signInData:', signInData);
        setError('Sign-in did not return a user object. Please try again.');
        setLoading(false);
        return;
      }

      console.log('[login] Signed in user id:', user.id);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('[login] profile fetch error:', profileError);
          const fallbackRole = roleFromURL || 'student';
          console.log('[login] Falling back to role:', fallbackRole);
          setLoading(false);
          if (fallbackRole === 'company') {
            router.push('/company');
          } else {
            router.push('/student');
          }
          return;
        }

        const role = profile?.role || roleFromURL || 'student';
        console.log('[login] Loaded profile role:', role);

        setLoading(false);
        if (role === 'company') {
          router.push('/company');
        } else {
          router.push('/student');
        }
      } catch (fetchErr) {
        console.error('[login] Error fetching profile:', fetchErr);
        setError('Could not load user profile. Try again later.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[login] Unexpected error:', err);
      setError(err?.message || 'Unexpected error during sign in.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-brand-dark to-slate-900 flex items-center justify-center pt-24">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400 mb-6">
              Login{roleFromURL ? ` as a ` : ''}{roleFromURL && <span className="font-semibold text-brand-primary">{roleFromURL}</span>}
            </p>

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-gray-400 mt-6">
              Don&apos;t have an account?{' '}
              <Link href={`/auth/signup${roleFromURL ? `?role=${roleFromURL}` : ''}`} className="text-brand-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

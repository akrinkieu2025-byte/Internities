"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';

export default function StudentSignupPage() {
  const router = useRouter();
  const [roleFromURL, setRoleFromURL] = useState('student');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r) setRoleFromURL(r);
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message || 'Signup failed');
        setLoading(false);
        return;
      }

      const userId = data?.user?.id ?? null;

      let idToUse = userId;
      if (!idToUse) {
        const { data: sessionData } = await supabase.auth.getSession();
        idToUse = sessionData?.session?.user?.id ?? null;
      }

      if (idToUse) {
        const { error: insertError } = await supabase.from('profiles').insert([{ id: idToUse, email, role: 'student' }]);
        if (insertError) console.warn('profile insert error', insertError);
      }

      router.push('/student');
    } catch (err) {
      setError(err?.message || 'Signup error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-brand-dark to-slate-900 flex items-center justify-center pt-24">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Create Student Account</h1>
            <p className="text-gray-400 mb-6">Sign up as a student to apply for internships.</p>

            {error && <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
            </form>

            <p className="text-center text-gray-400 mt-6">Already have an account? <Link href={`/auth/login${roleFromURL ? `?role=${roleFromURL}` : ''}`} className="text-brand-primary hover:underline">Login</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}

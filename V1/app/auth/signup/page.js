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
      <main className="min-h-screen bg-brand-dark text-brand-light flex items-center justify-center pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <h1 className="text-3xl font-bold mb-2 text-white">Create Student Account</h1>
            <p className="text-brand-light/70 mb-6">Sign up as a student to apply for internships.</p>

            {error && <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 shadow-glow-blue">{loading ? 'Creating...' : 'Create Account'}</button>
            </form>

            <p className="text-center text-brand-light/70 mt-6">Already have an account? <Link href={`/auth/login${roleFromURL ? `?role=${roleFromURL}` : ''}`} className="text-brand-primary hover:underline">Login</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}

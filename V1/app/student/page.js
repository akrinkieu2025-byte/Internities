// File: /app/student/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[student] getSession error:', sessionError);
        }

        if (!session || !session.user) {
          console.log('[student] no session, redirecting to login');
          router.push('/auth/login?role=student');
          return;
        }

        if (!mounted) return;

        setSessionUser(session.user);

        const { data: profileData, error: profileError, status } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && status !== 406) {
          console.error('[student] profile fetch error:', profileError);
          setError('Failed to load profile. Please try again.');
          setLoading(false);
          return;
        }

        if (!mounted) return;

        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        if (profileData.role && profileData.role !== 'student') {
          console.log('[student] user role is not student, redirecting to company area');
          router.push('/company');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('[student] unexpected error loading session/profile:', err);
        setError('Unexpected error loading dashboard. Please try again later.');
        setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark text-white pt-24 px-6">
          <div className="max-w-6xl mx-auto space-y-10 animate-pulse">
            <div className="h-28 bg-slate-800/70 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-28 bg-slate-800/60 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-72 bg-slate-800/60 rounded-2xl" />
              <div className="h-72 bg-slate-800/60 rounded-2xl lg:col-span-2" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <header className="glass-card border border-white/15 rounded-3xl p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-brand-light/50">Student workspace</p>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-3">Welcome back, {sessionUser?.email || 'student'}</h1>
              <p className="text-brand-light/70 mt-2 max-w-xl">
                Your matches, mentors, and deliverables stay in one place so you can focus on interviews.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push('/student/profile')}
                className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold"
              >
                Complete profile
              </button>
              <button
                type="button"
                onClick={() => router.push('/internships')}
                className="px-6 py-3 rounded-xl border border-white/20 text-sm font-semibold hover:border-brand-primary hover:text-white"
              >
                Explore roles
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-dashed border-white/10 text-brand-light/60 text-sm">
                Metrics coming soon.
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-6 xl:col-span-2">
              <section className="glass-card rounded-3xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">This week</p>
                    <h2 className="text-2xl font-semibold mt-2">Next actions</h2>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-brand-primary font-semibold hover:text-white"
                    onClick={() => router.push('/student/tasks')}
                  >
                    View tracker →
                  </button>
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-brand-light/60 text-sm">
                  Task tracker coming soon.
                </div>
              </section>

              <section className="glass-card rounded-3xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Mentorship</p>
                    <h2 className="text-2xl font-semibold mt-2">Upcoming sessions</h2>
                  </div>
                  <button type="button" className="text-sm text-brand-primary font-semibold">
                    Browse mentors →
                  </button>
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-brand-light/60 text-sm">
                  Mentor scheduling coming soon.
                </div>
              </section>

              <section className="glass-card rounded-3xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Saved roles</p>
                    <h2 className="text-2xl font-semibold mt-2">Opportunities on your radar</h2>
                  </div>
                  <button type="button" className="text-sm text-brand-primary font-semibold" onClick={() => router.push('/student/opportunities')}>
                    Manage →
                  </button>
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-brand-light/60 text-sm">
                  Saved roles will appear here soon.
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="glass-card rounded-3xl border border-white/10 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Pipeline</p>
                <h2 className="text-2xl font-semibold mt-2">Timeline</h2>
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-6 text-brand-light/60 text-sm">
                  Activity feed coming soon.
                </div>
              </section>

              <section className="glass-card rounded-3xl border border-white/10 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Account</p>
                <h2 className="text-2xl font-semibold mt-2">Profile snapshot</h2>
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-xs text-brand-light/60">Email</p>
                    <p className="font-medium">{sessionUser?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-light/60">Role</p>
                    <p className="font-medium">{profile?.role || 'student'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-light/60">Status</p>
                    <p className="font-medium text-brand-primary">Coming soon</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {error && (
            <div className="max-w-3xl">
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-2xl">{error}</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

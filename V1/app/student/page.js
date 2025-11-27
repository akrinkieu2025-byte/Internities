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
        <main className="min-h-screen bg-slate-900 text-white pt-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-28 bg-slate-800 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-40 bg-slate-800 rounded-lg" />
                <div className="h-40 bg-slate-800 rounded-lg" />
                <div className="h-40 bg-slate-800 rounded-lg" />
              </div>
              <div className="h-64 bg-slate-800 rounded-lg" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 flex items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {sessionUser?.email || 'Student'}</h2>
              <p className="text-slate-400 mt-1">Glad to see you — here's your student dashboard.</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-900/60 border border-slate-700 text-brand-primary">
                Student Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Your Skillset</h3>
                  <span className="text-sm text-slate-400">Keep this updated</span>
                </div>
                <div className="h-40 rounded-lg bg-slate-900/40 border border-dashed border-slate-700 flex items-center justify-center text-slate-400">
                  Skills will appear here
                </div>
              </section>

              <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Experience</h3>
                  <span className="text-sm text-slate-400">Add your internships</span>
                </div>
                <div className="h-28 rounded-lg bg-slate-900/40 border border-slate-700 flex items-center justify-center text-slate-400">
                  Experience placeholder card
                </div>
              </section>

              <section className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Education</h3>
                  <span className="text-sm text-slate-400">Add your degrees</span>
                </div>
                <div className="h-28 rounded-lg bg-slate-900/40 border border-slate-700 flex items-center justify-center text-slate-400">
                  Education placeholder card
                </div>
              </section>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/student/profile')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg shadow"
                >
                  Complete your profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/internships')}
                  className="bg-transparent border border-slate-700 hover:border-slate-600 text-slate-200 py-2 px-4 rounded-lg"
                >
                  Explore Internships
                </button>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
                <h4 className="text-lg font-semibold mb-4">Your AI Match Score</h4>
                <div className="text-5xl font-bold text-white mb-2">—</div>
                <p className="text-sm text-slate-400">Based on your future Skill Radar</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-3">Recommended Internships</h4>
                <div className="h-36 rounded-md border border-dashed border-slate-700 bg-slate-900/30 flex items-center justify-center text-slate-400">
                  AI recommendations will appear here
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h5 className="text-sm text-slate-400">Profile</h5>
                <div className="mt-2">
                  <p className="text-sm">Email</p>
                  <p className="font-medium truncate">{sessionUser?.email || '—'}</p>
                </div>
                <div className="mt-3">
                  <p className="text-sm">Role</p>
                  <p className="font-medium">{profile?.role || '—'}</p>
                </div>
              </div>
            </aside>
          </div>

          {error && (
            <div className="mt-6 max-w-3xl">
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

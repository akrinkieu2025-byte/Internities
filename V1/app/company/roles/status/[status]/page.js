"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const statusLabels = {
  draft: 'Draft roles',
  confirmed: 'Ready to publish',
  published: 'Live roles',
  archived: 'Role archive',
};

const statusFilters = ['draft', 'confirmed', 'published', 'archived'];

export default function RoleStatusPage() {
  const { status } = useParams();
  const router = useRouter();
  const normalized = Array.isArray(status) ? status[0] : status;
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;
      if (!currentSession) {
        router.replace('/auth/company/login');
        return;
      }
      setSession(currentSession);
      await loadRoles(currentSession);
      setLoading(false);
    }
    if (!normalized || !statusFilters.includes(normalized)) {
      router.replace('/company');
      return;
    }
    init();
  }, [normalized, router]);

  const loadRoles = async (activeSession) => {
    setError('');
    try {
      const res = await fetchWithAuth(`/api/roles?status=${normalized}`, { method: 'GET' }, supabase, activeSession);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to load roles');
      setRoles(payload.roles || []);
    } catch (err) {
      setError(err?.message || 'Failed to load roles');
    }
  };

  const archiveRole = async (roleId) => {
    if (!session) return;
    try {
      const res = await fetchWithAuth(
        '/api/roles/archive',
        { method: 'POST', body: JSON.stringify({ role_id: roleId }) },
        supabase,
        session
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Could not archive role');
      await loadRoles(session);
    } catch (err) {
      setError(err?.message || 'Could not archive role');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70">
          <p>Loading roles…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="glass-card rounded-3xl border border-white/15 p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-brand-light/50">Roles</p>
              <h1 className="text-3xl font-semibold mt-2">{statusLabels[normalized]}</h1>
              <p className="text-brand-light/70 mt-1">Filtered view of roles in this stage.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((s) => (
                <Link
                  key={s}
                  href={`/company/roles/status/${s}`}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${s === normalized ? 'border-brand-primary text-brand-primary' : 'border-white/15 text-brand-light/70 hover:border-brand-primary'}`}
                >
                  {statusLabels[s]}
                </Link>
              ))}
            </div>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <section className="glass-card rounded-3xl border border-white/10 p-6">
            {roles.length === 0 ? (
              <p className="text-brand-light/70">No roles in this category.</p>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-start justify-between gap-4 border border-white/10 rounded-2xl p-4">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{role.title || 'Untitled role'}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-light/50">{role.status}</p>
                      {role.location && <p className="text-brand-light/70 text-sm">{role.location}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/company/roles/${role.id}`}
                        className="px-3 py-1.5 rounded-lg border border-white/20 text-sm font-semibold hover:border-brand-primary whitespace-nowrap"
                      >
                        Open
                      </Link>
                      {role.status !== 'archived' && (
                        <button
                          onClick={() => archiveRole(role.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-400/40 text-sm font-semibold text-red-200 hover:border-red-400"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

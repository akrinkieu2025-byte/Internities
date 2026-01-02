"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function ListingsPage() {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        window.location.href = '/auth/company/login';
        return;
      }
      try {
        const res = await fetchWithAuth('/api/roles', { method: 'GET' }, supabase, sessionData.session);
        if (!res.ok) {
          const msg = await res.json().catch(() => ({ error: 'Failed to load roles' }));
          throw new Error(msg.error || 'Failed to load roles');
        }
        const payload = await res.json();
        setRoles(payload.roles || []);
      } catch (e) {
        setError(e.message || 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === roles.length) return new Set();
      return new Set(roles.map((r) => r.id));
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0 || deleting) return;
    const confirmDelete = window.confirm(`Delete ${selected.size} role(s)? This cannot be undone.`);
    if (!confirmDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        window.location.href = '/auth/company/login';
        return;
      }
      const failures = [];
      for (const id of selected) {
        const res = await fetchWithAuth(`/api/roles/${id}`, { method: 'DELETE' }, supabase, sessionData.session);
        if (!res.ok) {
          const msg = await res.json().catch(() => ({ error: 'Delete failed' }));
          failures.push(msg.error || 'Delete failed');
        }
      }
      if (failures.length > 0) {
        throw new Error(failures.join('; '));
      }
      setRoles((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    } catch (e) {
      setError(e.message || 'Failed to delete roles');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">Roles</p>
              <h1 className="text-3xl font-semibold mt-2">Your listings</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
              <Link
                href="/company"
                className="px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
              >
                ← Dashboard
              </Link>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting || selected.size === 0}
                className="px-4 py-2 rounded-xl border border-white/15 text-sm font-semibold text-brand-light/80 hover:border-red-400 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : `Delete selected (${selected.size})`}
              </button>
              <Link href="/company/roles/new" className="px-4 py-2 rounded-xl bg-brand-primary text-sm font-semibold">
                New role
              </Link>
            </div>
          </header>

          {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">{error}</div>}
          {loading && <p className="text-brand-light/70">Loading…</p>}

          {!loading && roles.length === 0 && (
            <div className="glass-card rounded-2xl border border-white/10 p-6 text-brand-light/70">No roles yet. Create your first role.</div>
          )}

          {!loading && roles.length > 0 && (
            <div className="glass-card rounded-3xl border border-white/10 p-6 overflow-x-auto">
              <table className="min-w-full text-sm text-brand-light/80">
                <thead>
                  <tr className="text-left text-brand-light/60">
                    <th className="py-2 pr-4">
                      <input
                        type="checkbox"
                        checked={roles.length > 0 && selected.size === roles.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-white/30 bg-transparent"
                      />
                    </th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-t border-white/5">
                      <td className="py-2 pr-4">
                        <input
                          type="checkbox"
                          checked={selected.has(role.id)}
                          onChange={() => toggleSelect(role.id)}
                          className="h-4 w-4 rounded border-white/30 bg-transparent"
                        />
                      </td>
                      <td className="py-2 pr-4">{role.title || 'Untitled role'}</td>
                      <td className="py-2 pr-4 text-brand-light/70">{role.status}</td>
                      <td className="py-2 pr-4 text-brand-light/60">{new Date(role.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 text-right">
                        <Link href={`/company/roles/${role.id}`} className="text-brand-primary font-semibold">Open →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

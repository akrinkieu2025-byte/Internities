"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RadarChart from '@/components/RadarChart';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const InfoTooltip = ({ label, value }) => (
  <span className="relative group inline-flex items-center" title={value}>
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-brand-light/80 uppercase tracking-[0.18em]">
      {label}
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] text-brand-light/70">i</span>
    </span>
    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 whitespace-pre rounded-lg bg-black/80 px-3 py-2 text-xs font-normal text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
      {value}
    </span>
  </span>
);

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params?.id;
  const [role, setRole] = useState(null);
  const [radars, setRadars] = useState([]);
  const [activeRadarIdx, setActiveRadarIdx] = useState(0);
  const [managingVersions, setManagingVersions] = useState(false);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState([]);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionInfo, setActionInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const normalizeRadars = (list = []) => {
    const sorted = [...list].sort((a, b) => new Date(a.snapshot.created_at) - new Date(b.snapshot.created_at));
    const confirmedIdx = sorted.findIndex((r) => r.snapshot.status === 'confirmed');
    const activeIdx = confirmedIdx >= 0 ? confirmedIdx : Math.max(sorted.length - 1, 0);
    return { sorted, activeIdx };
  };

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }
      const res = await fetchWithAuth(`/api/roles/${roleId}`, { method: 'GET' }, supabase, sessionData.session);
      if (!res.ok) {
        setError('Could not load role');
        return;
      }
      const payload = await res.json();
      const radarList = payload.radars || [];
      const { sorted, activeIdx } = normalizeRadars(radarList);
      setRole(payload.role || payload);
      setRadars(sorted);
      setActiveRadarIdx(activeIdx);
    };
    if (roleId) load();
  }, [roleId, router]);

  const reload = async () => {
    setActionError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      router.push('/auth/company/login');
      return;
    }
    const res = await fetchWithAuth(`/api/roles/${roleId}`, { method: 'GET' }, supabase, sessionData.session);
    if (!res.ok) {
      setActionError('Could not refresh role');
      return;
    }
    const payload = await res.json();
    const radarList = payload.radars || [];
    const { sorted, activeIdx } = normalizeRadars(radarList);
    setRole(payload.role || payload);
    setRadars(sorted);
    setActiveRadarIdx(activeIdx);
  };

  const handleAction = async (endpoint, body = null) => {
    setBusy(true);
    setActionError(null);
    setActionInfo(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetchWithAuth(
        endpoint,
        { method: 'POST', body: body ? JSON.stringify(body) : undefined },
        supabase,
        sessionData?.session
      );
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: 'Action failed' }));
        throw new Error(msg.error || 'Action failed');
      }
      const payload = await res.json();
      if (payload?.strategy) {
        setActionInfo(
          payload.strategy === 'ai'
            ? `Radar generated via AI (model ${payload.model || 'n/a'}).`
            : `Used fallback (reason: ${payload.fallbackReason || 'unknown'}).`
        );
      }
      await reload();
    } catch (e) {
      setActionError(e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleSnapshotSelection = (id) => {
    setSelectedSnapshotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSnapshots = async () => {
    if (!selectedSnapshotIds.length) return;
    setDeleteBusy(true);
    setActionError(null);
    setActionInfo(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetchWithAuth(
        `/api/roles/${roleId}/radar/delete`,
        { method: 'POST', body: JSON.stringify({ snapshot_ids: selectedSnapshotIds }) },
        supabase,
        sessionData?.session
      );
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(msg.error || 'Delete failed');
      }
      await reload();
      setSelectedSnapshotIds([]);
      setManagingVersions(false);
      setActionInfo('Selected versions deleted.');
    } catch (e) {
      setActionError(e.message || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));
    } catch (_e) {
      return d;
    }
  };

  const fmtDateTime = (d) => {
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
    } catch (_e) {
      return d;
    }
  };

  const timeframe = role?.start_date || role?.end_date
    ? `${fmtDate(role?.start_date) || 'Start TBD'} → ${fmtDate(role?.end_date) || 'End TBD'}`
    : null;

  const activeRadar = radars[activeRadarIdx] || null;
  const radarUpdatedAt = activeRadar?.snapshot?.created_at || null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Role detail</h1>
            <Link
              href="/company"
              className="px-3 py-2 rounded-xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
            >
              ← Dashboard
            </Link>
          </div>
          {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">{error}</div>}
          {role ? (
            <div className="glass-card rounded-3xl border border-white/10 p-8 space-y-6 bg-gradient-to-br from-white/5 via-white/0 to-white/5">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap text-brand-light/60 text-xs uppercase tracking-[0.25em]">
                    <InfoTooltip label="Role ID" value={role.id} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-3xl font-semibold leading-tight">{role.title}</p>
                    <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-brand-light/80">
                      {role.status || 'draft'}
                    </span>
                  </div>
                  <p className="text-brand-light/80 leading-relaxed whitespace-pre-line text-base">
                    {role.description || 'No description provided yet. Add a concise mission statement to attract the right candidates.'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-brand-light/80">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-brand-light/60 text-[11px] uppercase tracking-[0.2em]">Timeframe</p>
                      <p className="mt-1 text-brand-light">{timeframe || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-brand-light/60 text-[11px] uppercase tracking-[0.2em]">Location</p>
                      <p className="mt-1 text-brand-light">{role.location || 'Not provided'}</p>
                      <p className="text-brand-light/60 text-xs">{role.work_mode || 'Mode TBD'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-brand-light/60 text-[11px] uppercase tracking-[0.2em]">Division</p>
                      <p className="mt-1 text-brand-light">{role.division || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm text-brand-light/80">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-brand-light/60">Quick stats</p>
                  <div className="flex items-center justify-between">
                    <span>Applicants</span>
                    <span className="text-brand-light">—</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Openings</span>
                    <span className="text-brand-light">{role.openings || '1'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span className="text-brand-light">{fmtDate(role.created_at) || 'n/a'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Radar updated</span>
                    <span className="text-brand-light">{fmtDateTime(radarUpdatedAt) || 'n/a'}</span>
                  </div>
                </div>
              </div>

              {(role.responsibilities?.length || role.requirements?.length) && (
                <div className="grid gap-4 lg:grid-cols-2 text-sm text-brand-light/80">
                  {role.responsibilities?.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <p className="text-brand-light/60 text-[11px] uppercase tracking-[0.2em]">Responsibilities</p>
                      <div className="flex flex-wrap gap-2">
                        {role.responsibilities.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-brand-light/90">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {role.requirements?.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <p className="text-brand-light/60 text-[11px] uppercase tracking-[0.2em]">Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {role.requirements.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-brand-light/90">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!activeRadar) return;
                    router.push(`/company/roles/${roleId}/radar/chat?snapshot_id=${activeRadar.snapshot.id}`);
                  }}
                  disabled={busy || !activeRadar}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 shadow-lg shadow-brand-primary/30"
                >
                  Master the skill radar
                </button>
                <button
                  onClick={() => activeRadar && handleAction(`/api/roles/${roleId}/radar/confirm`, { snapshot_id: activeRadar.snapshot.id })}
                  disabled={busy || !activeRadar}
                  className="px-4 py-2 rounded-xl border border-white/15 text-sm font-semibold text-brand-light/80 hover:border-brand-primary disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Confirm snapshot'}
                </button>
                <button
                  onClick={() => router.push(`/company/roles/${roleId}/edit`)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl border border-white/15 text-sm font-semibold text-brand-light/80 hover:border-brand-primary disabled:opacity-50"
                >
                  Edit role
                </button>
                <button
                  onClick={() => handleAction(`/api/roles/${roleId}/publish`)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl border border-brand-primary bg-brand-primary/10 text-sm font-semibold text-brand-primary hover:bg-brand-primary/20 disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Publish role'}
                </button>
              </div>
            </div>
          ) : (
            !error && <p className="text-brand-light/70">Loading…</p>
          )}

          {actionError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">{actionError}</div>
          )}
          {actionInfo && (
            <div className="rounded-xl border border-brand-primary/40 bg-brand-primary/10 text-brand-light px-4 py-3 text-sm">{actionInfo}</div>
          )}

          {activeRadar && (
            <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">Skill radar</p>
                  <p className="flex flex-wrap items-center gap-3 text-brand-light/80 text-sm">
                    <span className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-brand-light/80">
                      Version {activeRadarIdx + 1}
                    </span>
                    <span className="text-brand-light/60">Created {fmtDateTime(activeRadar.snapshot.created_at) || 'n/a'}</span>
                    <span className="text-brand-light/60">•</span>
                    <span className="capitalize">{activeRadar.snapshot.status}</span>
                    <InfoTooltip label="Snapshot ID" value={activeRadar.snapshot.id} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveRadarIdx((idx) => Math.max(idx - 1, 0))}
                    disabled={activeRadarIdx === 0}
                    className="px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-brand-light/80 hover:border-brand-primary disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setActiveRadarIdx((idx) => Math.min(idx + 1, radars.length - 1))}
                    disabled={activeRadarIdx >= radars.length - 1}
                    className="px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-brand-light/80 hover:border-brand-primary disabled:opacity-40"
                  >
                    Next →
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSnapshotIds([]);
                      setManagingVersions(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-brand-primary bg-brand-primary/10 text-xs font-semibold text-brand-primary hover:bg-brand-primary/20"
                  >
                    Manage versions
                  </button>
                </div>
              </div>
              <div className="pt-4">
                <RadarChart scores={activeRadar.scores || []} size={420} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-brand-light/80">
                  <thead>
                    <tr className="text-left text-brand-light/60">
                      <th className="py-2 pr-4">Axis</th>
                      <th className="py-2 pr-4">Score</th>
                      <th className="py-2 pr-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRadar.scores.map((s, idx) => (
                      <tr key={idx} className="border-t border-white/5">
                        <td className="py-2 pr-4">{s.skill_axes?.display_name || s.skill_axes?.axis_key}</td>
                        <td className="py-2 pr-4">{s.score_0_100}</td>
                        <td className="py-2 pr-4 text-brand-light/60">{s.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {managingVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-brand-dark p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-light/60 uppercase tracking-[0.2em]">Manage versions</p>
                <p className="text-brand-light/80 text-sm">Select draft snapshots to delete. Confirmed versions cannot be deleted.</p>
              </div>
              <button
                onClick={() => {
                  setManagingVersions(false);
                  setSelectedSnapshotIds([]);
                }}
                className="px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-brand-light/80 hover:border-brand-primary"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-white/5">
              {radars.length === 0 && (
                <p className="text-brand-light/60 text-sm py-4">No snapshots available.</p>
              )}
              {radars.map((r, idx) => {
                const isConfirmed = r.snapshot.status === 'confirmed';
                const isSelected = selectedSnapshotIds.includes(r.snapshot.id);
                return (
                  <label
                    key={r.snapshot.id}
                    className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isConfirmed}
                      onChange={() => toggleSnapshotSelection(r.snapshot.id)}
                      className="h-4 w-4 rounded border-white/30 bg-white/5 text-brand-primary focus:ring-brand-primary disabled:opacity-40"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-brand-light/90 font-semibold">Version {idx + 1}</span>
                      <span className="text-xs text-brand-light/70">Created {fmtDateTime(r.snapshot.created_at) || 'n/a'}</span>
                    </div>
                    <span className={`ml-auto px-2 py-1 rounded-lg text-[11px] font-semibold ${
                      isConfirmed
                        ? 'border border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                        : 'border border-white/15 bg-white/5 text-brand-light/80'
                    }`}>
                      {isConfirmed ? 'Confirmed (locked)' : 'Draft'}
                    </span>
                    <InfoTooltip label="Snapshot ID" value={r.snapshot.id} />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-brand-light/70">
              <span>{selectedSnapshotIds.length} selected</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSnapshotIds([])}
                  className="px-3 py-2 rounded-xl border border-white/15 text-xs font-semibold text-brand-light/80 hover:border-brand-primary"
                >
                  Clear
                </button>
                <button
                  onClick={handleDeleteSnapshots}
                  disabled={!selectedSnapshotIds.length || deleteBusy}
                  className="px-4 py-2 rounded-xl border border-red-400/40 bg-red-500/10 text-xs font-semibold text-red-100 hover:bg-red-500/20 disabled:opacity-40"
                >
                  {deleteBusy ? 'Deleting…' : 'Delete selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

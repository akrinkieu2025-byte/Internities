"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RadarChart from '@/components/RadarChart';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const introMessage =
  'Tell the AI what kind of candidate you need, and it will rebalance the radar. Ask for fewer axes, adjusted scores, or rewritten labels. When ready, save the updated radar.';

const MIN_AXES = 6;
const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const normalizeRadar = (list) =>
  (list || []).map((a) => ({
    ...a,
  }));

export default function RadarChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = params?.id;
  const snapshotId = searchParams?.get('snapshot_id') || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);
  const [activeAxes, setActiveAxes] = useState([]);
  const [selectedAxisKey, setSelectedAxisKey] = useState(null);
  const [radar, setRadar] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busySend, setBusySend] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [alert, setAlert] = useState(null);
  const [canSave, setCanSave] = useState(true);
  const [versionMeta, setVersionMeta] = useState({ version: null, total: null });

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }
      try {
        const res = await fetchWithAuth(
          `/api/roles/${roleId}/radar/chat${snapshotId ? `?snapshot_id=${snapshotId}` : ''}`,
          { method: 'GET' },
          supabase,
          sessionData.session
        );
        if (!res.ok) {
          const msg = await res.json().catch(() => ({ error: 'Failed to load radar chat' }));
          throw new Error(msg.error || 'Failed to load radar chat');
        }
        const payload = await res.json();
        setRole(payload.role);
        setRadar(normalizeRadar(payload.radar || []));
        setActiveAxes(payload.active_axes || []);
        setSelectedAxisKey((payload.radar || [])[0]?.axis_key || (payload.active_axes || [])[0]?.axis_key || null);
        setCanSave(payload.canSave !== false);
        setVersionMeta({ version: payload.version || null, total: payload.total_versions || null });
        setMessages([{ sender: 'ai', content: introMessage }]);
        setAlert(payload.canSave === false ? 'This role is archived. You can explore ideas but must un-archive before saving.' : null);
        setLoading(false);
      } catch (e) {
        setError(e.message || 'Failed to load');
        setLoading(false);
      }
    };
    if (roleId) init();
  }, [roleId, router]);

  const sendMessage = async () => {
    if (!input.trim() || busySend) return;
    const nextMessages = [...messages, { sender: 'user', content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setBusySend(true);
    setAlert(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }
      const res = await fetchWithAuth(
        `/api/roles/${roleId}/radar/chat${snapshotId ? `?snapshot_id=${snapshotId}` : ''}`,
        {
          method: 'POST',
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.content })),
            radar,
            thread_id: threadId,
          }),
        },
        supabase,
        sessionData.session
      );
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: 'Chat failed' }));
        throw new Error(msg.error || 'Chat failed');
      }
      const payload = await res.json();
      setRadar(normalizeRadar(payload.radar || radar));
      setThreadId(payload.thread_id || threadId);
      setMessages((prev) => [...prev, { sender: 'ai', content: payload.reply || 'Updated the radar.' }]);
      if (payload.fallbackReason) setAlert(`Used fallback: ${payload.fallbackReason}`);
    } catch (e) {
      setAlert(e.message || 'Could not send message');
    } finally {
      setBusySend(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setBusySave(true);
    setAlert(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }
      const sanitized = radar.map((a) => ({
        axis_key: a.axis_key,
        label: a.label,
        score_0_100: clamp(Number(a.score_0_100) || 0, 0, 100),
        min_required_0_100: a.min_required_0_100,
        rationale: a.rationale,
      }));
      if (sanitized.length < MIN_AXES) throw new Error('Need at least 6 axes to save.');
      const res = await fetchWithAuth(
        `/api/roles/${roleId}/radar/save`,
        {
          method: 'POST',
          body: JSON.stringify({ radar: sanitized }),
        },
        supabase,
        sessionData.session
      );
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(msg.error || 'Save failed');
      }
      setAlert('Saved the new radar. Redirecting…');
      setTimeout(() => router.push(`/company/roles/${roleId}`), 800);
    } catch (e) {
      setAlert(e.message || 'Could not save radar');
    } finally {
      setBusySave(false);
    }
  };

  const updateRadarAxis = (axisKey, updates) => {
    setRadar((prev) => prev.map((a) => (a.axis_key === axisKey ? { ...a, ...updates } : a)));
  };

  const handleScoreChange = (axisKey, value) => {
    const num = clamp(Number(value) || 0, 0, 100);
    updateRadarAxis(axisKey, { score_0_100: num });
  };
  

  const working = useMemo(() => ({ list: radar }), [radar]);
  const axisMetaMap = useMemo(() => new Map((activeAxes || []).map((a) => [a.axis_key, a])), [activeAxes]);
  const selectedMeta = selectedAxisKey ? axisMetaMap.get(selectedAxisKey) : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70 pt-24">
          <p>Loading radar chat…</p>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70 pt-24">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
            {error}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.4em] text-brand-light/60">Skill radar</p>
              <h1 className="text-3xl font-semibold">Master the skill radar</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-brand-light/70">
                {role?.title && <p>{role.title}</p>}
                {versionMeta.version && (
                  <span className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-brand-light/80">
                    Version {versionMeta.version}{versionMeta.total ? ` of ${versionMeta.total}` : ''}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/company/roles/${roleId}`}
              className="px-3 py-2 rounded-xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
            >
              ← Back to role
            </Link>
          </header>

          {alert && (
            <div className="rounded-xl border border-white/10 bg-white/5 text-sm text-brand-light px-4 py-3">
              {alert}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="glass-card rounded-3xl border border-white/10 p-6 space-y-4 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">Preview</p>
                  <p className="text-brand-light/80 text-sm">{working.list.length} axes</p>
                </div>
              </div>
              <div className="pt-2">
                <RadarChart
                  scores={working.list.map((a) => ({ axis_key: a.axis_key, score_0_100: a.score_0_100, skill_axes: { axis_key: a.axis_key, display_name: a.label } }))}
                  size={420}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60">
                <div className="grid grid-cols-2 text-xs uppercase tracking-[0.2em] text-brand-light/60 px-4 py-2">
                  <span>Axis</span>
                  <span>Score</span>
                </div>
                <div className="divide-y divide-white/5">
                  {working.list.map((a) => {
                    const isSelected = a.axis_key === selectedAxisKey;
                    return (
                      <button
                        key={a.axis_key}
                        type="button"
                        onClick={() => setSelectedAxisKey(a.axis_key)}
                        className={`grid grid-cols-2 px-4 py-2 text-sm text-left text-brand-light/80 items-center gap-2 w-full transition ${
                          isSelected ? 'bg-white/5 border-l-4 border-brand-primary' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate" title={a.label || a.axis_key}>{a.label || a.axis_key}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(a.score_0_100 ?? 0)}
                          onChange={(e) => handleScoreChange(a.axis_key, e.target.value)}
                          className="w-20 rounded-lg bg-slate-900 border border-white/10 px-2 py-1 text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedMeta && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="max-w-full">
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-light/60">Axis details</p>
                      <h3 className="text-lg font-semibold text-white break-words">{selectedMeta.display_name}</h3>
                    </div>
                  </div>
                  <div className="text-sm text-brand-light/80 space-y-2 max-w-full break-words whitespace-pre-wrap">
                    <p>{selectedMeta.definition}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="glass-card rounded-3xl border border-white/10 p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">AI chat</p>
                  <p className="text-brand-light/70 text-sm">Ask for different axes, adjust scores, or rationale.</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.sender === 'ai'
                        ? 'bg-white/5 border border-white/10 text-brand-light'
                        : 'bg-brand-primary/10 border border-brand-primary/30 text-brand-light'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-[0.25em] text-brand-light/60 mb-1">
                      {m.sender === 'ai' ? 'AI' : 'You'}
                    </div>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for fewer axes, adjust scores, or rewrite labels…"
                  className="w-full rounded-2xl bg-slate-950 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  rows={3}
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={sendMessage}
                    disabled={busySend || !input.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-primary text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {busySend ? 'Sending…' : 'Send to AI'}
                  </button>
                  <div className="flex gap-2 text-xs text-brand-light/60">
                    <span>Model: 5.2</span>
                    {role?.status && <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">Status: {role.status}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5 mt-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!canSave || busySave || busySend}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busySave ? 'Saving…' : 'Save the new skill radar'}
                </button>
                <button
                  onClick={() => router.push(`/company/roles/${roleId}`)}
                  className="px-4 py-2 rounded-xl border border-white/15 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
                >
                  Discard and go back
                </button>
                <span className="text-xs text-brand-light/60">
                  {canSave ? 'Draft snapshot will be saved; publish later.' : 'Un-archive the role to enable saving.'}
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

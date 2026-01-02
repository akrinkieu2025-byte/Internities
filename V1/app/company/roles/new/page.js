"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const sectionsOrder = ['public_basics', 'public_q', 'private_q'];
const sectionLabels = {
  public_basics: 'Role basics',
  public_q: 'Public details',
  private_q: 'Private screening notes',
};

export default function NewRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }

      // ensure company + membership
      await fetchWithAuth('/api/company/bootstrap', { method: 'POST' }, supabase, sessionData.session);

      // Load questions via API; fall back to direct supabase fetch if needed
      let loaded = [];
      try {
        const res = await fetchWithAuth('/api/role-questions', { method: 'GET' }, supabase, sessionData.session);
        if (res.ok) {
          const payload = await res.json();
          loaded = payload.questions || [];
        } else {
          const msg = await res.json().catch(() => ({ error: 'Failed to load questions' }));
          setError(msg.error || 'Failed to load questions');
        }
      } catch (err) {
        setError(err.message || 'Failed to load questions');
      }

      if (loaded.length === 0) {
        const { data, error: qErr } = await supabase
          .from('role_questions')
          .select('*')
          .order('section', { ascending: true })
          .order('created_at', { ascending: true });
        if (!qErr && data) loaded = data;
      }

      setQuestions(loaded);
      setLoading(false);
    };
    init();
  }, [router]);

  const grouped = useMemo(() => {
    return sectionsOrder
      .map((section) => ({
        section,
        label: sectionLabels[section] || section,
        items: questions.filter((q) => q.section === section),
      }))
      .filter((group) => group.items.length > 0);
  }, [questions]);

  const handleChange = (slug, value) => {
    setResponses((prev) => ({ ...prev, [slug]: value }));
  };

  const handleDateChange = (field, value) => {
    setResponses((prev) => {
      const next = { ...prev, [field]: value };
      const start = field === '__dates_start' ? value : prev.__dates_start || '';
      const end = field === '__dates_end' ? value : prev.__dates_end || '';
      next.dates = start || end ? `${start} to ${end}`.trim() : '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        responses: Object.entries(responses).map(([slug, value]) => ({ slug, value })),
      };
      const res = await fetchWithAuth('/api/roles/create-with-answers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, supabase);
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: 'Failed to save role' }));
        throw new Error(msg.error || 'Failed to save role');
      }
      const { role } = await res.json();
      router.push(`/company/roles/${role.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70 pt-24">
          <p>Loading questionnaire…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="glass-card rounded-3xl border border-white/15 p-8">
            <p className="text-xs uppercase tracking-[0.5em] text-brand-light/50">Role setup</p>
            <h1 className="text-3xl font-semibold mt-3">Create a new role</h1>
            <p className="text-brand-light/70 mt-2">Answer a few questions to generate the role profile and skill radar.</p>
          </header>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {grouped.length === 0 && (
              <div className="glass-card rounded-3xl border border-white/10 p-6 text-brand-light/70">
                No questions available. Please refresh or contact support.
              </div>
            )}

            {grouped.map((group) => (
              <section key={group.section} className="glass-card rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{group.label}</h2>
                  <span className="text-xs uppercase tracking-[0.35em] text-brand-light/60">{group.items.length} questions</span>
                </div>
                <div className="space-y-4">
                  {group.items.map((q) => (
                    <div key={q.id || q.slug} className="space-y-2">
                      <label className="block text-sm font-semibold text-brand-light/80">{q.prompt}</label>
                      {q.slug === 'dates' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={responses.__dates_start || ''}
                            onChange={(e) => handleDateChange('__dates_start', e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                          <input
                            type="date"
                            value={responses.__dates_end || ''}
                            onChange={(e) => handleDateChange('__dates_end', e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        </div>
                      ) : q.answer_type === 'long_text' ? (
                        <textarea
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          rows={4}
                        />
                      ) : (
                        <input
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/company')}
                className="px-5 py-3 rounded-2xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-2xl bg-brand-primary text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save role'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

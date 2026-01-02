"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const sectionsOrder = ['public_basics', 'public_q', 'private_q'];
const sectionLabels = {
  public_basics: 'Role basics',
  public_q: 'Public details',
  private_q: 'Private screening notes',
};

const toList = (val) => {
  if (!val) return null;
  return val
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
};

const parseDateRange = (val) => {
  if (!val) return { start_date: null, end_date: null };
  if (typeof val === 'object') {
    const { start, end } = val;
    return parseDateRange(`${start || ''} to ${end || ''}`);
  }
  if (typeof val !== 'string') return { start_date: null, end_date: null };
  const parts = val.split(/\s+to\s+/i).map((p) => p.trim());
  const [startRaw, endRaw] = parts;
  const toISODate = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  return { start_date: toISODate(startRaw), end_date: toISODate(endRaw) };
};

const formatDateRange = (start, end) => {
  if (!start && !end) return '';
  if (start && end) return `${start} to ${end}`;
  if (start) return `${start} to `;
  return ` to ${end}`;
};

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [role, setRole] = useState(null);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }

      try {
        const resRole = await fetchWithAuth(`/api/roles/${roleId}`, { method: 'GET' }, supabase, sessionData.session);
        if (!resRole.ok) {
          throw new Error('Failed to load role');
        }
        const payload = await resRole.json();
        const loadedRole = payload.role || payload;
        setRole(loadedRole);

        let loadedQuestions = [];
        try {
          const qRes = await fetchWithAuth('/api/role-questions', { method: 'GET' }, supabase, sessionData.session);
          if (qRes.ok) {
            const qPayload = await qRes.json();
            loadedQuestions = qPayload.questions || [];
          }
        } catch (_e) {
          // ignore, fallback below
        }
        if (loadedQuestions.length === 0) {
          const { data, error: qErr } = await supabase
            .from('role_questions')
            .select('*')
            .order('section', { ascending: true })
            .order('created_at', { ascending: true });
          if (qErr) throw new Error(qErr.message);
          loadedQuestions = data || [];
        }
        setQuestions(loadedQuestions);

        // Load existing answers
        const { data: answerRows, error: ansErr } = await supabase
          .from('role_answers')
          .select('answer_text, question_id, role_questions!inner(slug)')
          .eq('role_id', roleId);
        if (ansErr) throw new Error(ansErr.message);

        // Build initial responses from answers and role fields
        const bySlug = answerRows?.reduce((acc, row) => {
          const slug = row.role_questions?.slug;
          if (slug) acc[slug] = row.answer_text || '';
          return acc;
        }, {}) || {};

        bySlug.title = bySlug.title ?? loadedRole.title ?? '';
        bySlug.division = bySlug.division ?? loadedRole.division ?? '';
        bySlug.location = bySlug.location ?? loadedRole.location ?? '';
        bySlug.description = bySlug.description ?? loadedRole.description ?? '';
        bySlug.responsibilities = bySlug.responsibilities ?? (loadedRole.responsibilities || []).join('\n');
        bySlug.requirements = bySlug.requirements ?? (loadedRole.requirements || []).join('\n');
        bySlug.dates = bySlug.dates ?? formatDateRange(loadedRole.start_date, loadedRole.end_date);
        bySlug.__dates_start = loadedRole.start_date || '';
        bySlug.__dates_end = loadedRole.end_date || '';

        setResponses(bySlug);
        setLoading(false);
      } catch (e) {
        setError(e.message || 'Failed to load role');
        setLoading(false);
      }
    };

    if (roleId) init();
  }, [roleId, router]);

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

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      router.push('/auth/company/login');
      return;
    }

    try {
      const answers = questions
        .map((q) => ({
          question_id: q.id,
          answer_text: responses[q.slug] ?? '',
          answer_value_int: null,
          answer_json: null,
        }))
        .filter((a) => a.answer_text !== undefined && a.answer_text !== null);

      const rolePayload = {
        title: responses.title || role?.title || 'Untitled role',
        division: responses.division || null,
        location: responses.location || null,
        work_mode: responses.location || null,
        description: responses.description || null,
        responsibilities: toList(responses.responsibilities),
        requirements: toList(responses.requirements),
        ...parseDateRange(responses.dates),
      };

      const { error: roleErr } = await supabase
        .from('roles')
        .update(rolePayload)
        .eq('id', roleId);
      if (roleErr) throw new Error(roleErr.message);

      const resAnswers = await fetchWithAuth(
        `/api/roles/${roleId}/answers`,
        {
          method: 'POST',
          body: JSON.stringify({ answers }),
        },
        supabase,
        sessionData.session
      );
      if (!resAnswers.ok) {
        const msg = await resAnswers.json().catch(() => ({ error: 'Failed to save answers' }));
        throw new Error(msg.error || 'Failed to save answers');
      }

      // Regenerate radar automatically after saving answers
      await fetchWithAuth(`/api/roles/${roleId}/radar/auto`, { method: 'POST' }, supabase, sessionData.session);

      router.push(`/company/roles/${roleId}`);
    } catch (err) {
      setError(err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70 pt-24">
          <p>Loading role…</p>
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
            <h1 className="text-3xl font-semibold mt-3">Edit role</h1>
            <p className="text-brand-light/70 mt-2">Update the questionnaire and we will regenerate the skill radar automatically.</p>
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
                onClick={() => router.push(`/company/roles/${roleId}`)}
                className="px-5 py-3 rounded-2xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-2xl bg-brand-primary text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

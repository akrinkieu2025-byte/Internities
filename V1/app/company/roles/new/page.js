"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function NewRolePage() {
  const router = useRouter();
  const industries = [
    'Technology',
    'Software',
    'Fintech',
    'Healthcare',
    'Biotech',
    'Pharmaceuticals',
    'Education',
    'E-commerce',
    'Retail',
    'Manufacturing',
    'Automotive',
    'Energy',
    'Renewables',
    'Telecommunications',
    'Media',
    'Entertainment',
    'Gaming',
    'Travel',
    'Hospitality',
    'Logistics',
    'Aerospace',
    'Defense',
    'Agriculture',
    'Food & Beverage',
    'Real Estate',
    'Construction',
    'Consulting',
    'Legal',
    'Nonprofit',
    'Government',
    'Other',
  ];
  const euCities = [
    'Amsterdam','Athens','Barcelona','Belgrade','Belfast','Berlin','Bern','Bilbao','Birmingham','Bologna','Bordeaux','Bournemouth','Braga','Bratislava','Bratislava','Bratislava','Bremen','Brescia','Bristol','Brno','Bruges','Brussels','Bucharest','Budapest','Cardiff','Catania','Chisinau','Cluj-Napoca','Cologne','Constanta','Copenhagen','Cork','Dortmund','Dresden','Dubrovnik','Dublin','Dusseldorf','Edinburgh','Eindhoven','Florence','Frankfurt','Gdansk','Geneva','Genoa','Ghent','Glasgow','Gothenburg','Granada','Graz','Hamburg','Helsinki','Innsbruck','Istanbul','Kaunas','Kiev','Klaipeda','Krakow','Las Palmas','Leeds','Leipzig','Lille','Limerick','Lisbon','Ljubljana','London','Lugano','Luxembourg','Lviv','Lyon','Madrid','Malaga','Malmo','Manchester','Marseille','Milan','Monaco','Moscow','Munich','Nantes','Naples','Nice','Nicosia','Odense','Odessa','Oslo','Palermo','Pamplona','Paris','Pisa','Podgorica','Porto','Prague','Reykjavik','Riga','Rome','Rotterdam','Salzburg','San Marino','Santa Cruz de Tenerife','Sarajevo','Seville','Skopje','Sofia','Split','St Petersburg','Stockholm','Stuttgart','Tallinn','Tampere','The Hague','Thessaloniki','Timisoara','Tirana','Torino','Toulouse','Turin','Turku','Utrecht','Valencia','Valletta','Venice','Verona','Vienna','Vilnius','Warsaw','Wroclaw','Zagreb','Zaragoza','Zurich'
  ];
  const euEeaChCountries = [
    'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Norway','Iceland','Liechtenstein','Switzerland'
  ];
  const internshipTypeOptions = ['Summer Internship', 'Off Cycle', 'Part time', 'Gap year', 'Other'];
  const degreeLevelOptions = ['High School Diploma', 'Bachelor', 'Master', 'MBA', 'PhD'];
  const studyProgressOptions = ['Penultimate year', 'Graduated this year', '3 years until Graduation', '4 years until Graduation'];
  const fieldsOfStudyOptions = [
    'Computer Science',
    'Information Systems',
    'Data Science',
    'Business Administration',
    'Economics',
    'Finance',
    'Marketing',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Industrial Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Design',
    'Psychology',
  ];
  const stakeholderExposureOptions = [
    'None',
    'Internal',
    'Cross Functional',
    'External Clients',
    'High Level Individuals',
  ];
  const workplaceEnvOptions = ['Learning', 'Learning and Performing', 'Performing'];
  const industryExpOptions = ['None', 'Some Experience', 'A lot of Experience'];
  const languageOptions = [
    'Arabic',
    'Bengali',
    'Danish',
    'Dutch',
    'English',
    'French',
    'German',
    'Hindi',
    'Italian',
    'Japanese',
    'Korean',
    'Mandarin Chinese',
    'Norwegian',
    'Polish',
    'Portuguese',
    'Russian',
    'Spanish',
    'Swedish',
    'Turkish',
    'Ukrainian',
  ];
  const requiredDocOptions = ['CV', 'Last Transcript', 'LinkedIn Profile Link'];
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [responses, setResponses] = useState({});
  const [bulletDrafts, setBulletDrafts] = useState({});
  const [bulletWeights, setBulletWeights] = useState({});
  const requiredSlugs = useMemo(
    () => new Set([
      'role_title',
      'industry',
      'department_name',
      'office_location',
      'workplace_type',
      'internship_type',
      'start_date',
      'company_overview',
      'key_responsibilities',
      'learning_outcomes',
      'application_deadline',
      'residency_requirements',
      'right_to_work',
      'enrolled_currently',
      'degree_level',
      'language_requirements',
      'required_hard_skills',
      'nice_to_have_hard_skills',
      'required_soft_skills',
      'experience_with_tools',
      'success_definition',
      'top_succeeding_traits',
      'top_failing_reasons',
      'top_responsibilities',
      'work_structure',
      'expected_autonomy',
      'stakeholder_exposure',
      'writing_presenting_intensity',
      'responsibility_level',
      'workplace_environment',
      'analytical_thinking',
      'creativity_level',
      'communication_ability',
      'industry_experience',
      'leadership_mindset',
    ]),
    []
  );
  const [residencyOpen, setResidencyOpen] = useState(false);
  const [rtwOpen, setRtwOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push('/auth/company/login');
        return;
      }

      // ensure company + membership
      await fetchWithAuth('/api/company/bootstrap', { method: 'POST' }, supabase, sessionData.session);

      // Load sections and questions via Supabase
      let loaded = [];
      let loadedSections = [];
      try {
        const { data: sectionRows } = await supabase
          .from('role_question_sections')
          .select('*')
          .order('display_order', { ascending: true });
        loadedSections = sectionRows || [];

        const { data, error: qErr } = await supabase
          .from('role_questions')
          .select('*')
          .order('display_order', { ascending: true })
          .order('section', { ascending: true })
          .order('created_at', { ascending: true });
        if (!qErr && data) loaded = data;
        else if (qErr) setError(qErr.message || 'Failed to load questions');
      } catch (err) {
        setError(err.message || 'Failed to load questions');
      }
      if (!loaded.some((q) => q.slug === 'required_soft_skills')) {
        loaded.push({
          slug: 'required_soft_skills',
          prompt: 'Required Soft Skills',
          section: 'skills_requirements',
          answer_type: 'bullet_builder_weighted',
          display_order: 16,
        });
      }

      setSections(loadedSections);
      setQuestions(loaded);
      setLoading(false);
    };
    init();
  }, [router]);

  const grouped = useMemo(() => {
    if (sections.length) {
      return sections
        .map((s) => ({
          section: s.key,
          label: s.title,
          description: s.description,
          items: questions
            .filter((q) => q.section === s.key)
            .sort((a, b) => (a.display_order || 999) - (b.display_order || 999)),
        }))
        .filter((g) => g.items.length > 0);
    }
    // Fallback grouping by section value
    const bySection = questions.reduce((acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    }, {});
    return Object.entries(bySection).map(([section, items]) => ({
      section,
      label: section,
      description: '',
      items: items.sort((a, b) => (a.display_order || 999) - (b.display_order || 999)),
    }));
  }, [questions, sections]);

  const handleChange = (slug, value) => {
    setResponses((prev) => ({ ...prev, [slug]: value }));
  };

  const parseBullets = (val, slug) => {
    if (!val) return [];
    const items = String(val)
      .split(/\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
    return slug === 'public_min_requirements' ? items : items.slice(0, 5);
  };

  const normalizeWeight = (raw) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return 50;
    // Accept legacy 1-5 weights by mapping to percentages
    if (n <= 5) return Math.min(100, Math.max(0, n * 20));
    return Math.min(100, Math.max(0, n));
  };

  const parseWeightedBullets = (val) => {
    if (!val) return [];
    return String(val)
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const parts = v.split(' :: ');
        return { text: parts[0], weight: normalizeWeight(parts[1] || 50) };
      });
  };

  const missingRequired = useMemo(() => {
    const missing = [];
    requiredSlugs.forEach((slug) => {
      const q = questions.find((x) => x.slug === slug);
      if (!q) return; // Skip validation if the question is not present in the loaded set
      const val = responses[slug];
      let ok = false;
      if ((q?.answer_type === 'bullet_builder_weighted') || ['required_hard_skills', 'nice_to_have_hard_skills', 'required_soft_skills', 'experience_with_tools'].includes(slug)) {
        ok = parseWeightedBullets(val).length > 0;
      } else if (q?.answer_type?.includes('bullet') || ['key_responsibilities', 'learning_outcomes', 'top_responsibilities', 'residency_requirements', 'right_to_work'].includes(slug)) {
        ok = parseBullets(val, slug).length > 0;
      } else {
        ok = Boolean(String(val || '').trim());
      }
      if (!ok) missing.push(slug);
    });
    return missing;
  }, [requiredSlugs, questions, responses]);

  const isFormValid = missingRequired.length === 0;
  const missingRequiredPrompts = useMemo(
    () =>
      missingRequired.map((slug) => {
        const q = questions.find((x) => x.slug === slug);
        return q?.prompt || slug;
      }),
    [missingRequired, questions]
  );

  const addBullet = (slug) => {
    const draft = (bulletDrafts[slug] || '').trim();
    if (!draft) return;
    if (slug !== 'public_min_requirements' && draft.length > 80) return;
    const existing = parseBullets(responses[slug], slug);

    // Dynamic limits
    let limit = 5;
    if (slug === 'top_succeeding_traits' || slug === 'top_failing_reasons') limit = 3;
    if (slug === 'ideal_candidate_background' || slug === 'public_min_requirements') limit = 20; // "Custom count" / Unlimited-ish

    if (existing.length >= limit) return;
    
    const next = [...existing, draft];
    setResponses((prev) => ({ ...prev, [slug]: next.join('\n') }));
    setBulletDrafts((prev) => ({ ...prev, [slug]: '' }));
  };

  const removeBullet = (slug, idx) => {
    const existing = parseBullets(responses[slug], slug);
    const next = existing.filter((_, i) => i !== idx);
    setResponses((prev) => ({ ...prev, [slug]: next.join('\n') }));
  };

  const addWeightedBullet = (slug, weightInput) => {
    const draft = (bulletDrafts[slug] || '').trim();
    if (!draft) return;
    const existing = parseWeightedBullets(responses[slug]);
    if (existing.length >= 10) return;

    const weight = normalizeWeight(weightInput ?? bulletWeights[slug] ?? 50);
    const item = `${draft} :: ${weight}`;
    const next = existing.map((x) => `${x.text} :: ${x.weight}`).concat(item);

    setResponses((prev) => ({ ...prev, [slug]: next.join('\n') }));
    setBulletDrafts((prev) => ({ ...prev, [slug]: '' }));
  };

  const updateWeightedBullet = (slug, idx, weightInput) => {
    const existing = parseWeightedBullets(responses[slug]);
    if (!existing[idx]) return;
    const weight = normalizeWeight(weightInput);
    const next = existing
      .map((x, i) => (i === idx ? { ...x, weight } : x))
      .map((x) => `${x.text} :: ${x.weight}`);
    setResponses((prev) => ({ ...prev, [slug]: next.join('\n') }));
  };

  const removeWeightedBullet = (slug, idx) => {
    const existing = parseWeightedBullets(responses[slug]);
    const next = existing.filter((_, i) => i !== idx).map((x) => `${x.text} :: ${x.weight}`);
    setResponses((prev) => ({ ...prev, [slug]: next.join('\n') }));
  };
  
  const parseWeighted = (str) => {
      if (!str) return { text: '', weight: 3 };
      const parts = str.split(':::');
      if (parts.length < 2) return { text: str, weight: 3 };
      return { text: parts[0], weight: parseInt(parts[1], 10) || 3 };
  };

  const toList = (val) => {
      // Override standard toList to avoid splitting by commas for weighted bullets if needed, but for now Standard behavior is fine as long as we join by \n.
      // The standard toList splits by \n or comma. This might break "Skill, C++:::5".
      // We should use a safer joiner for weighted bullets or change parseBullets.
      // For now, I will update parseBullets to be safer if needed, or just assume newline separation.
      if (!val) return null;
      return String(val).split(/\n/).map(v => v.trim()).filter(Boolean);
  };

  const handleMultiToggle = (slug, value) => {
    setResponses((prev) => {
      const current = (prev[slug] || '').split(/,\s*/).filter(Boolean);
      const has = current.includes(value);
      const next = has ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [slug]: next.join(', ') };
    });
  };

  const copyFromKeyResponsibilities = () => {
    const source = responses['key_responsibilities'];
    if (!source) return;
    const items = parseBullets(source, 'key_responsibilities');
    if (items.length === 0) return;
    setResponses((prev) => ({
      ...prev,
      top_responsibilities: items.slice(0, 5).join('\n'),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!isFormValid) {
      setSubmitting(false);
      setError('Please fill all required fields (marked with *).');
      return;
    }

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

  const preventEnterSubmit = (e) => {
    if (e.key === 'Enter' && e.target?.tagName !== 'TEXTAREA') {
      e.preventDefault();
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

          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-6">
            {grouped.length === 0 && (
              <div className="glass-card rounded-3xl border border-white/10 p-6 text-brand-light/70">
                No questions available. Please refresh or contact support.
              </div>
            )}

            {grouped.map((group) => (
              <section
                key={group.section}
                className={`glass-card rounded-3xl border border-white/10 p-6 space-y-4 overflow-visible ${
                  group.items.some(
                    (q) =>
                      (q.slug === 'language_requirements' && languagesOpen) ||
                      (q.slug === 'residency_requirements' && residencyOpen) ||
                      (q.slug === 'right_to_work' && rtwOpen)
                  )
                    ? 'relative z-50'
                    : 'relative'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{group.label}</h2>
                    {group.description ? <p className="text-sm text-brand-light/70 mt-1">{group.description}</p> : null}
                  </div>
                  <span className="text-xs uppercase tracking-[0.35em] text-brand-light/60">{group.items.length} questions</span>
                </div>
                <div className="space-y-4">
                  {group.items.map((q) => (
                    <div key={q.id || q.slug} className="space-y-2">
                      <label className="block text-base font-semibold text-white">
                        {q.prompt}
                        {requiredSlugs.has(q.slug) ? <span className="text-red-400 ml-1">*</span> : null}
                      </label>
                      {q.slug === 'role_title' ? (
                        <input
                          type="text"
                          maxLength={25}
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="Enter a concise title (25 chars)"
                        />
                      ) : q.slug === 'department_name' ? (
                        <input
                          type="text"
                          maxLength={35}
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="Enter department (35 chars)"
                        />
                      ) : q.slug === 'industry' ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            list="industry-options"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select or type an industry"
                          />
                          <datalist id="industry-options">
                            {industries.map((opt) => (
                              <option key={opt} value={opt} />
                            ))}
                          </datalist>
                        </div>
                      ) : q.slug === 'internship_type' ? (
                        <div className="space-y-2 relative">
                          <div className="flex flex-wrap gap-2">
                            {internshipTypeOptions.map((opt) => {
                              const selected = (responses[q.slug] || '').includes(opt);
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleMultiToggle(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select options above or type your own"
                          />
                        </div>
                      ) : q.slug === 'required_documents' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {requiredDocOptions.map((opt) => {
                              const selected = (responses[q.slug] || '').includes(opt);
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleMultiToggle(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select options above or add others (comma or newline to separate)"
                          />
                        </div>
                      ) : q.slug === 'degree_level' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {degreeLevelOptions.map((opt) => {
                              const current = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                              const selected = current.includes(opt);
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleMultiToggle(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select options above or add others (comma or newline to separate)"
                          />
                        </div>
                      ) : q.slug === 'study_progress' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {studyProgressOptions.map((opt) => {
                              const current = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                              const selected = current.includes(opt);
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleMultiToggle(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select options above or add others (comma or newline to separate)"
                          />
                        </div>
                      ) : q.slug === 'writing_presenting_intensity' ? (
                        <div className="space-y-6">
                          {(() => {
                            let val = { writing: 50, presenting: 50 };
                            try {
                              if (responses[q.slug]) val = JSON.parse(responses[q.slug]);
                            } catch {}
                            return (
                              <>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm text-brand-light/80">
                                    <span>Writing Intensity</span>
                                    <span className="font-semibold text-white">{val.writing}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={val.writing}
                                    onChange={(e) => {
                                      const next = { ...val, writing: parseInt(e.target.value) };
                                      setResponses((prev) => ({ ...prev, [q.slug]: JSON.stringify(next) }));
                                    }}
                                    className="w-full"
                                    style={{ accentColor: '#6366f1' }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm text-brand-light/80">
                                    <span>Presenting Intensity</span>
                                    <span className="font-semibold text-white">{val.presenting}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={val.presenting}
                                    onChange={(e) => {
                                      const next = { ...val, presenting: parseInt(e.target.value) };
                                      setResponses((prev) => ({ ...prev, [q.slug]: JSON.stringify(next) }));
                                    }}
                                    className="w-full"
                                    style={{ accentColor: '#6366f1' }}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : q.slug === 'workplace_environment' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {workplaceEnvOptions.map((opt) => (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => handleChange(q.slug, opt)}
                                className={`px-4 py-2 rounded-2xl border text-sm ${
                                  responses[q.slug] === opt
                                    ? 'border-brand-primary bg-brand-primary/20 text-white'
                                    : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : q.slug === 'industry_experience' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {industryExpOptions.map((opt) => (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => handleChange(q.slug, opt)}
                                className={`px-4 py-2 rounded-2xl border text-sm ${
                                  responses[q.slug] === opt
                                    ? 'border-brand-primary bg-brand-primary/20 text-white'
                                    : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (q.slug === 'minimum_gpa' || q.slug === 'work_structure' || q.slug === 'expected_autonomy' || q.slug === 'responsibility_level' || q.slug === 'analytical_thinking' || q.slug === 'creativity_level' || q.slug === 'communication_ability' || q.slug === 'leadership_mindset') ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-brand-light/80">
                            <span>{q.prompt} (0–100%)</span>
                            <span className="font-semibold text-white">{responses[q.slug] || (q.slug === 'minimum_gpa' ? 75 : 50)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={responses[q.slug] || (q.slug === 'minimum_gpa' ? 75 : 50)}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full"
                            style={{ accentColor: '#6366f1' }}
                          />
                        </div>
                      ) : (q.answer_type === 'bullet_builder_limit_3' || q.slug === 'ideal_candidate_background' || q.slug === 'top_succeeding_traits' || q.slug === 'top_failing_reasons') ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {parseBullets(responses[q.slug], q.slug).map((item, idx) => (
                              <span
                                key={`${item}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeBullet(q.slug, idx)}
                                  className="text-xs text-brand-light/70 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={80}
                              value={bulletDrafts[q.slug] || ''}
                              onChange={(e) => setBulletDrafts((prev) => ({ ...prev, [q.slug]: e.target.value }))}
                              className="flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder="Add a bullet (max 80 chars)"
                            />
                            <button
                              type="button"
                              onClick={() => addBullet(q.slug)}
                              disabled={
                                (bulletDrafts[q.slug] || '').trim().length === 0 ||
                                ((q.answer_type === 'bullet_builder_limit_3' || q.slug === 'top_succeeding_traits' || q.slug === 'top_failing_reasons') && parseBullets(responses[q.slug], q.slug).length >= 3)
                              }
                              className="rounded-2xl px-4 py-2 bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ) : (q.slug === 'minimum_gpa' || q.slug === 'work_structure' || q.slug === 'expected_autonomy' || q.slug === 'responsibility_level' || q.slug === 'analytical_thinking' || q.slug === 'creativity_level' || q.slug === 'communication_ability' || q.slug === 'leadership_mindset') ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-brand-light/80">
                            <span>{q.prompt} (0–100%)</span>
                            <span className="font-semibold text-white">{responses[q.slug] || (q.slug === 'minimum_gpa' ? 75 : 50)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={responses[q.slug] || (q.slug === 'minimum_gpa' ? 75 : 50)}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full"
                            style={{ accentColor: '#6366f1' }}
                          />
                        </div>
                      ) : q.slug === 'writing_presenting_intensity' ? (
                        <div className="space-y-4">
                          {['Writing', 'Presenting'].map((key) => {
                            let valObj = { Writing: 50, Presenting: 50 };
                            if (responses[q.slug]) {
                              try {
                                valObj = JSON.parse(responses[q.slug]);
                              } catch {
                                valObj = { Writing: 50, Presenting: 50 };
                              }
                            }
                            return (
                              <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-brand-light/80">
                                  <span>{key} Intensity (0–100%)</span>
                                  <span className="font-semibold text-white">{valObj[key]}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={valObj[key]}
                                  onChange={(e) => {
                                    const next = { ...valObj, [key]: parseInt(e.target.value) };
                                    handleChange(q.slug, JSON.stringify(next));
                                  }}
                                  className="w-full"
                                  style={{ accentColor: '#6366f1' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : q.slug === 'workplace_environment' || q.slug === 'industry_experience' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(q.slug === 'workplace_environment' ? workplaceEnvOptions : industryExpOptions).map((opt) => {
                              const selected = responses[q.slug] === opt;
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleChange(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (q.answer_type === 'bullet_builder_weighted' || ['required_hard_skills', 'nice_to_have_hard_skills', 'experience_with_tools', 'required_soft_skills'].includes(q.slug)) ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {parseWeightedBullets(responses[q.slug]).map((item, idx) => (
                              <div
                                key={`${item.text}-${idx}`}
                                className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-slate-900 px-3 py-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-sm text-white">{item.text}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeWeightedBullet(q.slug, idx)}
                                    className="text-xs text-brand-light/70 hover:text-red-300"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={item.weight}
                                    onChange={(e) => updateWeightedBullet(q.slug, idx, e.target.value)}
                                    className="w-full"
                                    style={{ accentColor: '#6366f1' }}
                                  />
                                  <span className="text-xs font-semibold text-brand-primary w-12 text-right">{item.weight}%</span>
                                </div>
                              </div>
                            ))}
                            {parseWeightedBullets(responses[q.slug]).length === 0 && (
                              <p className="text-xs text-brand-light/60">Add bullets and set an importance percentage for each.</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                            <input
                              type="text"
                              maxLength={80}
                              value={bulletDrafts[q.slug] || ''}
                              onChange={(e) => setBulletDrafts((prev) => ({ ...prev, [q.slug]: e.target.value }))}
                              className="flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder={`Add ${q.prompt.toLowerCase()} (max 80 chars)`}
                            />
                            <div className="flex items-center gap-2 w-full md:w-56">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={bulletWeights[q.slug] ?? 50}
                                onChange={(e) => setBulletWeights((prev) => ({ ...prev, [q.slug]: parseInt(e.target.value, 10) }))}
                                className="w-full"
                                style={{ accentColor: '#6366f1' }}
                              />
                              <span className="text-xs text-brand-light/70 w-12 text-right">{bulletWeights[q.slug] ?? 50}%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addWeightedBullet(q.slug, bulletWeights[q.slug])}
                              disabled={(bulletDrafts[q.slug] || '').trim().length === 0}
                              className="rounded-2xl px-4 py-2 bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-brand-light/60">Set importance per bullet (0–100%).</p>
                        </div>
                      ) : q.slug === 'top_succeeding_traits' || q.slug === 'top_failing_reasons' || q.slug === 'ideal_candidate_background' ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {parseBullets(responses[q.slug], q.slug).map((item, idx) => (
                              <span
                                key={`${item}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeBullet(q.slug, idx)}
                                  className="text-xs text-brand-light/70 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                           <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={80}
                              value={bulletDrafts[q.slug] || ''}
                              onChange={(e) => setBulletDrafts((prev) => ({ ...prev, [q.slug]: e.target.value }))}
                              className="flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder={
                                q.slug === 'top_succeeding_traits' ? 'Trait (e.g. Proactive)' :
                                q.slug === 'top_failing_reasons' ? 'Reason (e.g. Poor communication)' :
                                'Add bullet point'
                              }
                            />
                            <button
                              type="button"
                              onClick={() => addBullet(q.slug)}
                              disabled={
                                (bulletDrafts[q.slug] || '').trim().length === 0 ||
                                (
                                  (q.slug === 'top_succeeding_traits' || q.slug === 'top_failing_reasons') && parseBullets(responses[q.slug], q.slug).length >= 3
                                )
                              }
                              className="rounded-2xl px-4 py-2 bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                           </div>
                           <p className="text-xs text-brand-light/60">
                             {q.slug === 'top_succeeding_traits' || q.slug === 'top_failing_reasons' 
                              ? 'Add exactly 3 items.' 
                              : 'Add items describing the ideal background.'}
                           </p>
                        </div>
                      ) : q.slug === 'fields_of_study' || q.slug === 'stakeholder_exposure' || q.slug === 'workplace_environment' || q.slug === 'industry_experience' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                                let opts = [];
                                if (q.slug === 'fields_of_study') opts = fieldsOfStudyOptions;
                                else if (q.slug === 'stakeholder_exposure') opts = stakeholderExposureOptions;
                                else if (q.slug === 'workplace_environment') opts = workplaceEnvOptions;
                                else if (q.slug === 'industry_experience') opts = industryExpOptions;
                                
                                return opts.map((opt) => {
                                  // For single select pills (Workplace, Industry), we behave like radio.
                                  // For multi select (Fields, Stakeholder), we toggle.
                                  const isMulti = q.slug === 'fields_of_study' || q.slug === 'stakeholder_exposure';
                                  const current = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                                  const selected = current.includes(opt);
                                  
                                  return (
                                    <button
                                      type="button"
                                      key={opt}
                                      onClick={() => {
                                          if (isMulti) handleMultiToggle(q.slug, opt);
                                          else handleChange(q.slug, opt);
                                      }}
                                      className={`px-3 py-2 rounded-2xl border text-sm ${
                                        selected
                                          ? 'border-brand-primary bg-brand-primary/20 text-white'
                                          : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                });
                            })()}
                          </div>
                          {!['workplace_environment', 'industry_experience'].includes(q.slug) && (
                            <input
                                type="text"
                                value={responses[q.slug] || ''}
                                onChange={(e) => handleChange(q.slug, e.target.value)}
                                className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="Select options above or add others (comma or newline to separate)"
                            />
                          )}
                        </div>
                      ) : q.slug === 'stakeholder_exposure' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {stakeholderExposureOptions.map((opt) => {
                              const current = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                              const selected = current.includes(opt);
                              return (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => handleMultiToggle(q.slug, opt)}
                                  className={`px-3 py-2 rounded-2xl border text-sm ${
                                    selected
                                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                                      : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select options above or add others (comma or newline to separate)"
                          />
                        </div>
                      ) : q.slug === 'language_requirements' ? (
                        <div className="space-y-2">
                          <label className="text-xs text-brand-light/60">Select required languages</label>
                          <div className="relative z-20">
                            <button
                              type="button"
                              onClick={() => setLanguagesOpen((o) => !o)}
                              className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-left text-white flex items-center justify-between"
                            >
                              <span className="text-sm text-brand-light/80">
                                {(() => {
                                  const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                                  if (!selected.length) return 'Choose languages';
                                  if (selected.length === 1) return selected[0];
                                  return `${selected.length} languages selected`;
                                })()}
                              </span>
                              <span className="text-brand-light/60 text-xs">{languagesOpen ? '▲' : '▼'}</span>
                            </button>
                            {languagesOpen && (
                              <div className="absolute z-30 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 shadow-lg max-h-64 overflow-auto">
                                <div className="p-2 space-y-1">
                                  {languageOptions.map((lang) => {
                                    const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean).includes(lang);
                                    return (
                                      <label key={lang} className="flex items-center gap-2 px-2 py-1 text-sm text-white hover:bg-white/5 rounded-xl">
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          onChange={() => handleMultiToggle(q.slug, lang)}
                                          className="accent-indigo-400"
                                        />
                                        <span>{lang}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Select from the list or add others (comma or newline to separate)"
                          />
                        </div>
                      ) : q.slug === 'residency_requirements' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleChange(q.slug, (responses[q.slug] || '').trim().toLowerCase() === 'eu/eea/ch only' ? '' : 'EU/EEA/CH only')}
                              className={`px-3 py-2 rounded-2xl border text-sm ${
                                (responses[q.slug] || '').trim().toLowerCase() === 'eu/eea/ch only'
                                  ? 'border-brand-primary bg-brand-primary/20 text-white'
                                  : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                              }`}
                            >
                              EU/EEA/CH only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChange(q.slug, (responses[q.slug] || '').trim().toLowerCase() === 'none' ? '' : 'None')}
                              className={`px-3 py-2 rounded-2xl border text-sm ${
                                (responses[q.slug] || '').trim().toLowerCase() === 'none'
                                  ? 'border-brand-primary bg-brand-primary/20 text-white'
                                  : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                              }`}
                            >
                              None
                            </button>
                            <span className="text-xs text-brand-light/60">Shown to students as residency/visa eligibility.</span>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-brand-light/60">Select eligible countries</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setResidencyOpen((o) => !o)}
                                disabled={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase())}
                                className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-left text-white flex items-center justify-between disabled:opacity-50"
                              >
                                <span className="text-sm text-brand-light/80">
                                  {(() => {
                                    const val = (responses[q.slug] || '').trim().toLowerCase();
                                    if (val === 'eu/eea/ch only') return 'EU/EEA/CH only';
                                    if (val === 'none') return 'No residency requirement';
                                    const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                                    if (!selected.length) return 'Choose countries';
                                    if (selected.length === 1) return selected[0];
                                    return `${selected.length} countries selected`;
                                  })()}
                                </span>
                                <span className="text-brand-light/60 text-xs">{residencyOpen ? '▲' : '▼'}</span>
                              </button>
                              {residencyOpen && !['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase()) && (
                                <div className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 shadow-lg max-h-60 overflow-auto">
                                  <div className="p-2 space-y-1">
                                    {euEeaChCountries.map((country) => {
                                      const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean).includes(country);
                                      return (
                                        <label key={country} className="flex items-center gap-2 px-2 py-1 text-sm text-white hover:bg-white/5 rounded-xl">
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => handleMultiToggle(q.slug, country)}
                                            className="accent-indigo-400"
                                          />
                                          <span>{country}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase()) ? '' : (responses[q.slug] || '')}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            disabled={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase())}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                            placeholder="Select from the list or type other countries (comma or newline to separate)"
                          />
                          <p className="text-xs text-brand-light/60">
                            Use EU/EEA/CH only, pick specific eligible countries, or select None. This is shown to students during application as residency/visa requirements.
                          </p>
                        </div>
                      ) : q.slug === 'right_to_work' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleChange(q.slug, (responses[q.slug] || '').trim().toLowerCase() === 'eu/eea/ch only' ? '' : 'EU/EEA/CH only')}
                              className={`px-3 py-2 rounded-2xl border text-sm ${
                                (responses[q.slug] || '').trim().toLowerCase() === 'eu/eea/ch only'
                                  ? 'border-brand-primary bg-brand-primary/20 text-white'
                                  : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                              }`}
                            >
                              EU/EEA/CH only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChange(q.slug, (responses[q.slug] || '').trim().toLowerCase() === 'none' ? '' : 'None')}
                              className={`px-3 py-2 rounded-2xl border text-sm ${
                                (responses[q.slug] || '').trim().toLowerCase() === 'none'
                                  ? 'border-brand-primary bg-brand-primary/20 text-white'
                                  : 'border-white/15 text-brand-light/80 hover:border-brand-primary'
                              }`}
                            >
                              None
                            </button>
                            <span className="text-xs text-brand-light/60">Shown to students as right-to-work eligibility.</span>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-brand-light/60">Select eligible countries</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setRtwOpen((o) => !o)}
                                disabled={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase())}
                                className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-left text-white flex items-center justify-between disabled:opacity-50"
                              >
                                <span className="text-sm text-brand-light/80">
                                  {(() => {
                                    const val = (responses[q.slug] || '').trim().toLowerCase();
                                    if (val === 'eu/eea/ch only') return 'EU/EEA/CH only';
                                    if (val === 'none') return 'No right-to-work requirement';
                                    const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean);
                                    if (!selected.length) return 'Choose countries';
                                    if (selected.length === 1) return selected[0];
                                    return `${selected.length} countries selected`;
                                  })()}
                                </span>
                                <span className="text-brand-light/60 text-xs">{rtwOpen ? '▲' : '▼'}</span>
                              </button>
                              {rtwOpen && !['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase()) && (
                                <div className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 shadow-lg max-h-60 overflow-auto">
                                  <div className="p-2 space-y-1">
                                    {euEeaChCountries.map((country) => {
                                      const selected = (responses[q.slug] || '').split(/,\s*/).filter(Boolean).includes(country);
                                      return (
                                        <label key={country} className="flex items-center gap-2 px-2 py-1 text-sm text-white hover:bg-white/5 rounded-xl">
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => handleMultiToggle(q.slug, country)}
                                            className="accent-indigo-400"
                                          />
                                          <span>{country}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase()) ? '' : (responses[q.slug] || '')}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            disabled={['eu/eea/ch only', 'none'].includes((responses[q.slug] || '').trim().toLowerCase())}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                            placeholder="Select from the list or type other countries (comma or newline to separate)"
                          />
                          <p className="text-xs text-brand-light/60">
                            Use EU/EEA/CH only, pick specific eligible countries, or select None. This is shown to students during application as right-to-work requirements.
                          </p>
                        </div>
                      ) : q.slug === 'workplace_type' ? (
                        <select
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                          <option value="">Select workplace type</option>
                          <option value="Onsite">Onsite</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Remote">Remote</option>
                        </select>
                      ) : q.slug === 'office_location' ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            list="eu-cities"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            placeholder="Start typing a European city"
                          />
                          <datalist id="eu-cities">
                            {euCities.map((city) => (
                              <option key={city} value={city} />
                            ))}
                          </datalist>
                        </div>
                      ) : q.slug === 'hours_per_week' ? (
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="10"
                            max="60"
                            step="1"
                            value={responses[q.slug] || 40}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full"
                            style={{ accentColor: '#6366f1' }}
                          />
                          <div className="flex justify-between text-xs text-indigo-200">
                            <span>10h</span>
                            <span className="font-semibold text-indigo-100">{responses[q.slug] || 40} h/week</span>
                            <span>60h</span>
                          </div>
                        </div>
                      ) : q.section === 'role_description' && ['start_date', 'application_deadline'].includes(q.slug) ? (
                        q.slug === 'start_date' ? (
                          <input
                            type="month"
                            value={(responses[q.slug] || '').slice(0, 7)}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="calendar-light w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        ) : (
                          <input
                            type="date"
                            value={responses[q.slug] || ''}
                            onChange={(e) => handleChange(q.slug, e.target.value)}
                            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          />
                        )
                      ) : q.slug === 'key_responsibilities' || q.slug === 'learning_outcomes' || q.slug === 'public_min_requirements' || q.slug === 'top_responsibilities' ? (
                        <div className="space-y-3">
                          {q.slug === 'top_responsibilities' && (
                            <button
                              type="button"
                              onClick={copyFromKeyResponsibilities}
                              className="text-sm font-medium text-brand-primary hover:text-brand-light flex items-center gap-2"
                            >
                              <span className="text-lg">📋</span> Copy from Key Responsibilities
                            </button>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {parseBullets(responses[q.slug], q.slug).map((item, idx) => (
                              <span
                                key={`${item}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeBullet(q.slug, idx)}
                                  className="text-xs text-brand-light/70 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {parseBullets(responses[q.slug], q.slug).length === 0 && (
                              <span className="text-xs text-brand-light/60">
                                {q.slug === 'public_min_requirements'
                                  ? 'Add any number of minimum requirement bullets; no character limit.'
                                  : 'Add up to 5 bullets (max 80 chars each).'}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={q.slug === 'public_min_requirements' ? undefined : 80}
                              value={bulletDrafts[q.slug] || ''}
                              onChange={(e) => setBulletDrafts((prev) => ({ ...prev, [q.slug]: e.target.value }))}
                              className="flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder={
                                q.slug === 'learning_outcomes'
                                  ? 'Add a learning outcome (max 80 chars)'
                                  : q.slug === 'public_min_requirements'
                                  ? 'Add a minimum requirement students will see (any length)'
                                  : q.slug === 'top_responsibilities'
                                  ? 'Add a top 5 responsibility (max 80 chars)'
                                  : 'Add a responsibility (max 80 chars)'
                              }
                            />
                            <button
                              type="button"
                              onClick={() => addBullet(q.slug)}
                              disabled={
                                (bulletDrafts[q.slug] || '').trim().length === 0 ||
                                (q.slug !== 'public_min_requirements' &&
                                  (parseBullets(responses[q.slug], q.slug).length >= 5 || (bulletDrafts[q.slug] || '').trim().length > 80))
                              }
                              className="rounded-2xl px-4 py-2 bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-brand-light/60">
                            {q.slug === 'learning_outcomes'
                              ? 'Describe 3–5 concrete skills, experiences, or outcomes an intern will gain (max 80 chars each).'
                              : q.slug === 'public_min_requirements'
                              ? 'These bullets are shown to students during application as the minimum requirements. Add as many concise points as you need.'
                              : q.slug === 'top_responsibilities'
                              ? 'List the top 5 responsibilities used to evaluate the role (max 80 chars each).'
                              : 'List 3–5 core responsibilities for this role (max 80 chars each).'}
                          </p>
                        </div>
                      ) : ['long_text', 'text', 'text_short', 'bullet_builder', 'bullet_builder_weighted', 'multi_select', 'multi_select_text'].includes(q.answer_type) ? (
                        <textarea
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          placeholder={
                            q.slug === 'company_overview'
                              ? 'Example: Building an AI-powered recruiting platform for European SMEs.'
                              : q.slug === 'success_definition'
                              ? 'Example: Ship MVP by week 6 and own weekly client updates.'
                              : 'Enter text; for lists use commas or new lines'
                          }
                          maxLength={q.slug === 'company_overview' ? 150 : undefined}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          rows={q.answer_type?.includes('bullet') ? 3 : 2}
                        />
                      ) : q.answer_type?.startsWith('slider') ? (
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      ) : q.answer_type === 'yes_no' || q.answer_type === 'toggle' ? (
                        <select
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      ) : q.answer_type === 'date' ? (
                        <input
                          type="date"
                          value={responses[q.slug] || ''}
                          onChange={(e) => handleChange(q.slug, e.target.value)}
                          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-white placeholder:text-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-primary"
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

            <div className="flex flex-col items-end gap-2">
              {!isFormValid && !submitting && (
                <div className="space-y-2 text-xs text-red-200/90 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      width="16"
                      height="16"
                      className="text-red-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="4.5" y="8" width="11" height="9" rx="2" />
                      <path d="M7.5 8V6a2.5 2.5 0 0 1 5 0v2" />
                      <circle cx="10" cy="12.5" r="1" />
                    </svg>
                    <span>Fill all required (*) fields to enable save.</span>
                  </div>
                  {missingRequiredPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {missingRequiredPrompts.map((label) => (
                        <span key={label} className="px-2 py-1 rounded-lg border border-red-300/40 bg-red-500/10 text-[11px] text-red-100/90">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            <div className="flex justify-end gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => router.push('/company')}
                className="px-5 py-3 rounded-2xl border border-white/10 text-sm font-semibold text-brand-light/80 hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="relative px-6 py-3 rounded-2xl bg-brand-primary text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Save role'}
              </button>
            </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

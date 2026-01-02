"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const industryOptions = [
  'B2B SaaS',
  'Marketplace',
  'Fintech',
  'Health/Medtech',
  'Edtech',
  'Climate/CleanTech',
  'Cybersecurity',
  'DevTools',
  'AI/ML',
  'Hardware/IoT',
  'Logistics/Supply Chain',
  'Manufacturing/Industrial',
  'Media/Content',
  'Gaming',
  'Nonprofit/Impact',
  'GovTech/Public Sector',
  'Consumer Apps',
  'Travel/Hospitality',
  'PropTech',
  'Bio/Pharma',
  'Energy',
  'Retail/eCommerce',
  'Sports/Fitness',
  'Automotive/Mobility',
  'Food/AgTech',
  'Telecom',
  'Insurance/Insurtech',
  'LegalTech',
  'HR Tech',
  'Analytics/Data',
  'AdTech/MarTech',
  'Other',
];

export default function CompanyProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canProceed, setCanProceed] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [industryOther, setIndustryOther] = useState('');
  const [website, setWebsite] = useState('');
  const [hqLocation, setHqLocation] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;
      if (!currentSession) {
        router.replace('/auth/company/login');
        return;
      }
      setSession(currentSession);
      await loadProfile(currentSession);
      setLoading(false);
    }
    init();
  }, [router]);

  const loadProfile = async (activeSession) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetchWithAuth('/api/company/profile', { method: 'GET' }, supabase, activeSession);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to load profile');
      }
      const payload = await res.json();
      const company = payload.company || {};
      setName(company.name || '');
      setIndustry(company.industry || '');
      setIndustryOther(company.industry_other || '');
      setWebsite(company.website || '');
      setHqLocation(company.hq_location || '');
      setLogoPath(company.logo_path || '');
      setLogoUrl(payload.signedLogoUrl || '');
      setCanProceed(Boolean(payload.isComplete));
    } catch (err) {
      setError(err?.message || 'Could not load profile');
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchWithAuth('/api/company/logo', { method: 'POST', body: formData }, supabase, session);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Logo upload failed');
      }
      setLogoPath(payload.path || '');
      setLogoUrl(payload.signedUrl || '');
      setSuccess('Logo updated');
      setCanProceed(false);
    } catch (err) {
      setError(err?.message || 'Could not upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!session) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const body = {
        name,
        industry,
        industry_other: industry === 'Other' ? industryOther : '',
        website,
        hq_location: hqLocation,
        logo_path: logoPath,
      };

      const res = await fetchWithAuth(
        '/api/company/profile',
        { method: 'PUT', body: JSON.stringify(body) },
        supabase,
        session
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to save');
      }
      setSuccess('Profile saved');
      const company = payload.company || {};
      setLogoUrl(payload.signedLogoUrl || '');
      setName(company.name || name);
      setIndustry(company.industry || industry);
      setIndustryOther(company.industry_other || '');
      setWebsite(company.website || website);
      setHqLocation(company.hq_location || hqLocation);
      setLogoPath(company.logo_path || logoPath);
      setCanProceed(Boolean(payload.isComplete));
    } catch (err) {
      setError(err?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70">
          <p>Loading profile…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="glass-card rounded-3xl border border-white/15 p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-brand-light/50">Company profile</p>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-3">Profile & branding</h1>
              <p className="text-brand-light/70 mt-2 max-w-2xl">Keep your workspace tidy with an accurate name, industry, and logo. This does not block other dashboard actions.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-sm text-brand-light/70">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-cover" />
                ) : (
                  <span>Logo</span>
                )}
              </div>
              <div>
                <label className="block text-sm text-brand-light/70 mb-1">Update logo</label>
                <input type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} disabled={uploading} className="text-sm" />
                <p className="text-xs text-brand-light/50">PNG or JPEG, max 2 MB</p>
              </div>
            </div>
          </header>

          {(error || success) && (
            <div className={`${error ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'} rounded-xl border px-4 py-3 text-sm`}>
              {error || success}
            </div>
          )}

          <section className="glass-card rounded-3xl border border-white/10 p-8">
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-light/80 mb-2">Company name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Acme Labs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-light/80 mb-2">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-light/80 mb-2">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">Select an industry</option>
                    {industryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-light/80 mb-2">HQ location</label>
                  <input
                    type="text"
                    value={hqLocation}
                    onChange={(e) => setHqLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {industry === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-brand-light/80 mb-2">Describe your industry</label>
                  <input
                    type="text"
                    value={industryOther}
                    onChange={(e) => setIndustryOther(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="e.g., Space tech"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-premium px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <p className="text-sm text-brand-light/60">Fill this once; you can change it later.</p>
                {canProceed && (
                  <button
                    type="button"
                    onClick={() => router.push('/company')}
                    className="px-4 py-2 rounded-lg border border-white/30 text-sm font-semibold hover:border-brand-primary"
                  >
                    Proceed to dashboard
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

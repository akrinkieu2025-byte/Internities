"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function CompanyDashboard() {
	const [user, setUser] = useState(null);
	const [companyName, setCompanyName] = useState('');
	const [loading, setLoading] = useState(true);
	const [roles, setRoles] = useState([]);
	const [counts, setCounts] = useState({});
	const [error, setError] = useState(null);

	useEffect(() => {
		const checkAuth = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				window.location.href = '/auth/company/login';
				return;
			}

			setUser(session.user);
			const complete = await ensureProfileComplete(session);
			if (!complete) return;
			await loadDashboard(session);
			setLoading(false);
		};

		checkAuth();
	}, []);

	const ensureProfileComplete = async (session) => {
		try {
			const res = await fetchWithAuth('/api/company/profile', { method: 'GET' }, supabase, session);
			if (!res.ok) {
				throw new Error('Failed to load profile');
			}
			const payload = await res.json();
			if (!payload?.isComplete) {
				window.location.href = '/company/profile';
				return false;
			}
			setCompanyName(payload?.company?.name || 'your company');
			return true;
		} catch (e) {
			setError(e.message || 'Something went wrong');
			window.location.href = '/company/profile';
			return false;
		}
	};

	const loadDashboard = async (session) => {
		try {
			const res = await fetchWithAuth('/api/roles', { method: 'GET' }, supabase, session);
			if (!res.ok) {
				throw new Error('Failed to load roles');
			}
			const payload = await res.json();
			setRoles(payload.roles || []);
			setCounts(payload.counts || {});
		} catch (e) {
			setError(e.message || 'Something went wrong');
		}
	};

	if (loading) {
		return (
			<>
				<Navbar />
				<main className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-light/70">
					<p>Loading workspace…</p>
				</main>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-brand-dark text-white pt-24 pb-16 px-6">
				<div className="max-w-7xl mx-auto space-y-10">
					<header className="glass-card rounded-3xl border border-white/15 p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.5em] text-brand-light/50">Company workspace</p>
							<h1 className="text-3xl sm:text-4xl font-semibold mt-3">Welcome back, {companyName || 'your company'}</h1>
							<p className="text-brand-light/70 mt-2 max-w-2xl">
								Monitor pipelines, collaborate with reviewers, and move candidates from application to offer in days.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<Link href="/company/roles/new" className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-center">
								Post new role
							</Link>
							<Link href="/company/profile" className="px-6 py-3 rounded-xl border border-white/20 text-sm font-semibold text-center hover:border-brand-primary">
								Company profile
							</Link>
						</div>
					</header>

					{error && (
						<div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
							{error}
						</div>
					)}

					<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{[
							{ label: 'Draft roles', key: 'draft' },
							{ label: 'Ready to publish', key: 'confirmed' },
							{ label: 'Live roles', key: 'published' },
							{ label: 'Role archive', key: 'archived' },
						].map((metric) => (
							<Link
								key={metric.key}
								href={`/company/roles/status/${metric.key}`}
								className="glass-card rounded-2xl p-5 border border-white/10 hover:border-brand-primary transition-colors"
							>
								<p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">{metric.label}</p>
								<p className="text-3xl font-semibold mt-3">{counts[metric.key] || 0}</p>
							</Link>
						))}
					</section>

					<section className="glass-card rounded-3xl border border-white/10 p-6">
						<div className="flex items-center justify-between mb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Open roles</p>
								<h2 className="text-2xl font-semibold mt-2">What needs attention</h2>
							</div>
							<Link href="/company/listings" className="text-sm text-brand-primary font-semibold">
								Manage roles →
							</Link>
						</div>
						<div className="rounded-2xl border border-white/10 p-6 text-brand-light/80 text-sm space-y-3">
							{roles.length === 0 ? (
								<p className="text-brand-light/60">No roles yet—create your first one to start gathering candidates.</p>
							) : (
								<div className="space-y-3">
									{roles.slice(0, 10).map((role) => (
										<div key={role.id} className="flex items-start justify-between gap-3">
											<div>
												<p className="text-base font-semibold">{role.title || 'Untitled role'}</p>
												<p className="text-xs uppercase tracking-[0.3em] text-brand-light/50 mt-1">{role.status}</p>
											</div>
											<Link href={`/company/roles/${role.id}`} className="text-sm text-brand-primary font-semibold whitespace-nowrap">
												Open →
											</Link>
										</div>
									))}
								</div>
							)}
						</div>
					</section>
				</div>
			</main>
		</>
	);
}

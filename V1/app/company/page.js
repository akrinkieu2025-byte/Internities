"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabaseClient';

export default function CompanyDashboard() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

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
			setLoading(false);
		};

		checkAuth();
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		window.location.href = '/';
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
							<h1 className="text-3xl sm:text-4xl font-semibold mt-3">Welcome back, {user?.email}</h1>
							<p className="text-brand-light/70 mt-2 max-w-2xl">
								Monitor pipelines, collaborate with reviewers, and move candidates from application to offer in days.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<Link href="/company/post" className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-center">
								Post new role
							</Link>
							<Link
								href="/company/applications"
								className="px-6 py-3 rounded-xl border border-white/20 text-sm font-semibold text-center hover:border-brand-primary"
							>
								Open pipeline
							</Link>
						</div>
					</header>

					<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, idx) => (
							<div key={idx} className="glass-card rounded-2xl p-5 border border-dashed border-white/10 text-brand-light/60 text-sm">
								Metrics coming soon.
							</div>
						))}
					</section>

					<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
						<section className="glass-card rounded-3xl border border-white/10 p-6 xl:col-span-2">
							<div className="flex items-center justify-between mb-6">
								<div>
									<p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Pipeline health</p>
									<h2 className="text-2xl font-semibold mt-2">Internship funnel</h2>
								</div>
								<Link href="/company/applications" className="text-sm text-brand-primary font-semibold">
									Open dashboard →
								</Link>
							</div>
							<div className="rounded-2xl border border-dashed border-white/10 p-6 text-brand-light/60 text-sm">
								Pipeline view coming soon.
							</div>
						</section>

						<section className="glass-card rounded-3xl border border-white/10 p-6">
							<div className="flex items-center justify-between mb-4">
								<p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Tasks</p>
								<button type="button" className="text-sm text-brand-primary font-semibold">
									Assign →
								</button>
							</div>
							<div className="rounded-2xl border border-dashed border-white/10 p-6 text-brand-light/60 text-sm">
								Team tasks coming soon.
							</div>
						</section>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
							<div className="rounded-2xl border border-dashed border-white/10 p-6 text-brand-light/60 text-sm">
								Listings table coming soon.
							</div>
						</section>

						<section className="glass-card rounded-3xl border border-white/10 p-6">
							<div className="flex items-center justify-between mb-4">
								<p className="text-xs uppercase tracking-[0.4em] text-brand-light/50">Team</p>
								<button type="button" className="text-sm text-brand-primary font-semibold">
									Invite reviewer →
								</button>
							</div>
							<div className="rounded-2xl border border-dashed border-white/10 p-6 text-brand-light/60 text-sm">
								Team activity coming soon.
							</div>
							<div className="mt-6">
								<button
									onClick={handleLogout}
									className="w-full rounded-2xl border border-red-500/40 text-red-300 py-3 hover:bg-red-500/10 transition"
								>
									Sign out
								</button>
							</div>
						</section>
					</div>
				</div>
			</main>
		</>
	);
}

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
				<main className="min-h-screen bg-gradient-to-br from-brand-dark to-slate-900 flex items-center justify-center">
					<p className="text-gray-400">Loading...</p>
				</main>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-gradient-to-br from-brand-dark to-slate-900 p-6">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-4xl font-bold mb-2">Company Dashboard</h1>
						<p className="text-gray-400">Welcome back, {user?.email}</p>
					</div>

					{/* Quick Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
							<div className="text-gray-400 text-sm mb-2">Active Listings</div>
							<div className="text-3xl font-bold">0</div>
						</div>
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
							<div className="text-gray-400 text-sm mb-2">Applications</div>
							<div className="text-3xl font-bold">0</div>
						</div>
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
							<div className="text-gray-400 text-sm mb-2">In Review</div>
							<div className="text-3xl font-bold">0</div>
						</div>
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
							<div className="text-gray-400 text-sm mb-2">Hired</div>
							<div className="text-3xl font-bold">0</div>
						</div>
					</div>

					{/* Action Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-brand-primary transition">
							<h3 className="text-xl font-semibold mb-2">Post New Internship</h3>
							<p className="text-gray-400 mb-4">Create a new internship listing to attract top student talent.</p>
							<Link href="/company/post" className="inline-block bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
								Create Listing
							</Link>
						</div>

						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-brand-primary transition">
							<h3 className="text-xl font-semibold mb-2">Manage Listings</h3>
							<p className="text-gray-400 mb-4">Edit, update, or close your internship listings.</p>
							<Link href="/company/listings" className="inline-block bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
								View Listings
							</Link>
						</div>

						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-brand-primary transition">
							<h3 className="text-xl font-semibold mb-2">Review Applications</h3>
							<p className="text-gray-400 mb-4">Browse and manage applications from interested students.</p>
							<Link href="/company/applications" className="inline-block bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
								View Applications
							</Link>
						</div>

						<div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-brand-primary transition">
							<h3 className="text-xl font-semibold mb-2">Company Profile</h3>
							<p className="text-gray-400 mb-4">Update your company information and preferences.</p>
							<Link href="/company/profile" className="inline-block bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
								Edit Profile
							</Link>
						</div>
					</div>

					{/* Logout Button */}
					<div className="mt-8">
						<button
							onClick={handleLogout}
							className="bg-red-900/20 border border-red-700 text-red-300 px-6 py-2 rounded-lg hover:bg-red-900/40 transition"
						>
							Logout
						</button>
					</div>
				</div>
			</main>
		</>
	);
}

'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function GetStartedPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-brand-light pt-24 pb-12 flex items-center justify-center">
        <div className="w-full max-w-5xl px-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white">Get Started</h1>
            <p className="text-brand-light/70 mt-2">Choose the account type that best describes you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/get-started/student" className="group">
              <div className="cursor-pointer transform hover:-translate-y-1 transition-all duration-200 bg-white/5 border border-white/10 rounded-xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="text-6xl">🎓</div>
                <h2 className="mt-4 text-2xl font-semibold text-white">Student</h2>
                <p className="mt-2 text-brand-light/70">Find internships, build your profile, and apply.</p>
                <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-brand-primary hover:opacity-90 text-white font-medium transition shadow-glow-blue">
                  Continue as Student
                </div>
              </div>
            </Link>

            <Link href="/get-started/company" className="group">
              <div className="cursor-pointer transform hover:-translate-y-1 transition-all duration-200 bg-white/5 border border-white/10 rounded-xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="text-6xl">🏢</div>
                <h2 className="mt-4 text-2xl font-semibold text-white">Company</h2>
                <p className="mt-2 text-brand-light/70">Post internships, review applicants, and hire talent.</p>
                <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-brand-secondary hover:opacity-90 text-white font-medium transition shadow-glow-purple">
                  Continue as Company
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

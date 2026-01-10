import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function RoleSelectionPage({ params }) {
  const { role } = params;

  if (role !== 'student' && role !== 'company') {
    redirect('/get-started');
  }

  const isStudent = role === 'student';

  const signupPath = isStudent ? '/auth/signup' : '/auth/company/signup';
  const loginPath = isStudent ? '/auth/login' : '/auth/company/login';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-dark text-brand-light pt-24 pb-12 flex items-center justify-center">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">{isStudent ? 'Student' : 'Company'}</h1>
            <p className="text-brand-light/70 mt-2">Choose whether you want to sign up or log in.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href={signupPath} className="group block h-full">
              <div className="h-full transform hover:-translate-y-1 transition-all duration-200 bg-white/5 border border-white/10 rounded-xl p-8 text-center flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <h2 className="text-xl font-semibold text-white">Sign Up</h2>
                <p className="mt-2 text-brand-light/70">Create a new {isStudent ? 'student' : 'company'} account.</p>
                <div className={`mt-6 inline-flex w-full justify-center items-center gap-3 px-4 py-2 rounded-lg ${isStudent ? 'bg-brand-primary' : 'bg-brand-secondary'} hover:opacity-90 text-white font-medium transition`}>
                  {isStudent ? 'Create Student Account' : 'Create Company Account'}
                </div>
              </div>
            </Link>

            <Link href={loginPath} className="group block h-full">
              <div className="h-full transform hover:-translate-y-1 transition-all duration-200 bg-white/5 border border-white/10 rounded-xl p-8 text-center flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <h2 className="text-xl font-semibold text-white">Login</h2>
                <p className="mt-2 text-brand-light/70">Sign in to your {isStudent ? 'student' : 'company'} account.</p>
                <div className={`mt-6 inline-flex w-full justify-center items-center gap-3 px-4 py-2 rounded-lg ${isStudent ? 'bg-brand-primary' : 'bg-brand-secondary'} hover:opacity-90 text-white font-medium transition`}>
                  {isStudent ? 'Student Login' : 'Company Login'}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

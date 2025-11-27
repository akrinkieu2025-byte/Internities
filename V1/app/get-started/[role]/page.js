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
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-24 pb-12 flex items-center justify-center">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">{isStudent ? 'Student' : 'Company'}</h1>
            <p className="text-gray-400 mt-2">Choose whether you want to sign up or log in.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href={signupPath} className="group">
              <div className={`transform hover:-translate-y-1 transition-all duration-200 bg-slate-800 border border-slate-700 rounded-xl p-8 text-center`}>
                <h2 className="text-xl font-semibold text-white">Sign Up</h2>
                <p className="mt-2 text-gray-400">Create a new {isStudent ? 'student' : 'company'} account.</p>
                <div className={`mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-lg ${isStudent ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white font-medium transition`}>
                  {isStudent ? 'Create Student Account' : 'Create Company Account'}
                </div>
              </div>
            </Link>

            <Link href={loginPath} className="group">
              <div className={`transform hover:-translate-y-1 transition-all duration-200 bg-slate-800 border border-slate-700 rounded-xl p-8 text-center`}>
                <h2 className="text-xl font-semibold text-white">Login</h2>
                <p className="mt-2 text-gray-400">Sign in to your {isStudent ? 'student' : 'company'} account.</p>
                <div className={`mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-lg ${isStudent ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white font-medium transition`}>
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

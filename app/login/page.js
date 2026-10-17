'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured, getLocalUsers, getUserProfile, getAuthEmailByUsn } from '../../lib/supabaseClient';
import { verifyLocalCredentials } from '../../lib/authUtils';
import { useAuth } from '../../lib/auth';
import { Trophy, LogIn, GraduationCap, Lock, AlertCircle, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setLocalSession } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your College USN or Personal Email.');
      setLoading(false);
      return;
    }

    if (!password || !password.trim()) {
      setErrorMsg('Please enter your password.');
      setLoading(false);
      return;
    }

    const isEmailInput = cleanInput.includes('@');
    const cleanUsn = cleanInput.toUpperCase();
    const cleanEmail = cleanInput.toLowerCase();

    // Resolve internal auth email
    let authEmail = isEmailInput ? cleanEmail : null;
    if (!authEmail) {
      authEmail = await getAuthEmailByUsn(cleanUsn);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        if (!authEmail) {
          setErrorMsg('No registered account found with this USN or Email.');
          setLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          setErrorMsg('Invalid USN, Personal Email, or password. Please verify your credentials.');
          setLoading(false);
          return;
        }

        // Fetch user profile from Supabase to check admin privileges
        const profile = await getUserProfile(authData.user.id);

        if (profile?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } catch (err) {
        setErrorMsg('Network error. Please try again.');
        setLoading(false);
      }
    } else {
      // Local / Starter simulation mode
      const users = getLocalUsers();
      const matched = users.find(
        (u) =>
          u.usn?.toUpperCase() === cleanUsn ||
          (u.email && u.email.toLowerCase() === cleanEmail) ||
          u.name?.toLowerCase() === cleanInput.toLowerCase()
      );

      // Explicitly reject unverified/unknown identifiers: never auto-register on login!
      if (!matched) {
        setErrorMsg('No account found with this USN or Personal Email. Please check your credentials or register.');
        setLoading(false);
        return;
      }

      // Verify credentials against stored cryptographic hash
      const isValidPassword = await verifyLocalCredentials(matched.usn, password);
      if (!isValidPassword) {
        setErrorMsg('Invalid USN, Personal Email, or password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      const mockUser = {
        id: matched.id,
        email: matched.email || authEmail,
        user_metadata: {
          name: matched.name,
          usn: matched.usn,
          department: matched.department,
          year: matched.year,
          email: matched.email,
        },
      };

      // Establish authenticated session with rememberMe preference
      setLocalSession(mockUser, matched, rememberMe);

      if (matched.is_admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Log In to Sports Hub
          </h1>
          <p className="text-xs text-slate-500">
            Dr. A.C.S. College of Engineering (ACSCE) — Sign in with your College USN or Personal Email
          </p>
        </div>

        {/* Fixed College Institution Badge */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Institution
            </span>
            <span className="font-extrabold text-slate-800 text-xs">
              Dr. A.C.S. College of Engineering (ACSCE)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
            ACSCE Portal
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>College USN or Personal Email</span>
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 1AH24CS212 or student@gmail.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 hover:text-slate-900 transition">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 transition"
              />
              <span className="font-medium">Remember me across sessions</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          New student?{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
            Register with USN & Personal Email
          </Link>
        </div>
      </div>
    </div>
  );
}

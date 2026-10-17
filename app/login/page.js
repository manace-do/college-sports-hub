'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  supabase,
  isSupabaseConfigured,
  getLocalUsers,
  getUserProfile,
  getAuthEmailByUsn,
  resendVerificationEmail,
  requestPasswordReset,
} from '../../lib/supabaseClient';
import { verifyLocalCredentials } from '../../lib/authUtils';
import { useAuth } from '../../lib/auth';
import {
  Trophy,
  LogIn,
  GraduationCap,
  Lock,
  AlertCircle,
  Mail,
  Clock,
  RotateCw,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setLocalSession } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Email confirmation & resend states
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState(null);

  // Password reset modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState(null);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Synchronous submission locks
  const isSubmittingRef = useRef(false);
  const isResendingRef = useRef(false);
  const isForgotSubmittingRef = useRef(false);

  // Cooldown countdowns
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const interval = setInterval(() => {
      setForgotCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg(null);
    setUnconfirmedEmail(null);
    setResendFeedback(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your College USN or Personal Email.');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (!password || !password.trim()) {
      setErrorMsg('Please enter your password.');
      setLoading(false);
      isSubmittingRef.current = false;
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
          setErrorMsg('No registered account found with this USN or Personal Email. Please verify your credentials or register.');
          setLoading(false);
          isSubmittingRef.current = false;
          return;
        }

        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          const rawMsg = (error.message || '').toLowerCase();

          // Requirement 4: Distinguish specific auth failures instead of blindly reporting invalid credentials
          if (rawMsg.includes('email not confirmed')) {
            setUnconfirmedEmail(authEmail);
            setErrorMsg(
              'Your Personal Email has not been confirmed yet. Please click the verification link sent to your inbox before signing in.'
            );
          } else if (rawMsg.includes('rate limit') || rawMsg.includes('over_email_send_rate_limit') || error.status === 429) {
            setErrorMsg('Too many login attempts. Please wait a few moments before trying again.');
          } else if (rawMsg.includes('invalid login credentials')) {
            setErrorMsg('Invalid USN, Personal Email, or password. Please verify your credentials.');
          } else {
            setErrorMsg(error.message || 'Authentication error. Please try again.');
          }

          setLoading(false);
          isSubmittingRef.current = false;
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
        setErrorMsg('Network connection error. Please verify your internet connection and try again.');
        setLoading(false);
        isSubmittingRef.current = false;
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

      if (!matched) {
        setErrorMsg('No account found with this USN or Personal Email. Please check your credentials or register.');
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      // Verify credentials against stored cryptographic hash
      const isValidPassword = await verifyLocalCredentials(matched.usn, password);
      if (!isValidPassword) {
        setErrorMsg('Invalid USN, Personal Email, or password. Please verify your credentials.');
        setLoading(false);
        isSubmittingRef.current = false;
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

      setLocalSession(mockUser, matched, rememberMe);

      if (matched.is_admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  // Handle controlled resend of verification email with cooldown
  const handleResend = async () => {
    if (!unconfirmedEmail || resending || resendCooldown > 0 || isResendingRef.current) return;
    isResendingRef.current = true;
    setResending(true);
    setResendFeedback(null);

    try {
      await resendVerificationEmail(unconfirmedEmail);
      setResendFeedback({
        type: 'success',
        message: `Verification email resent to ${unconfirmedEmail}. Please check your inbox and spam folder.`,
      });
      setResendCooldown(60); // 60s cooldown to preserve email quota
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit') || err.status === 429) {
        setResendCooldown(60);
        setResendFeedback({
          type: 'error',
          message: 'Email rate limit reached. Please wait a few minutes before requesting another verification email.',
        });
      } else {
        setResendFeedback({
          type: 'error',
          message: err.message || 'Failed to resend verification email. Please try again later.',
        });
      }
    } finally {
      setResending(false);
      isResendingRef.current = false;
    }
  };

  // Handle password reset request with cooldown protection
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (isForgotSubmittingRef.current || forgotLoading || forgotCooldown > 0) return;
    isForgotSubmittingRef.current = true;
    setForgotLoading(true);
    setForgotFeedback(null);

    const input = forgotIdentifier.trim();
    if (!input) {
      setForgotFeedback({ type: 'error', message: 'Please enter your USN or Personal Email.' });
      setForgotLoading(false);
      isForgotSubmittingRef.current = false;
      return;
    }

    try {
      let targetEmail = input.includes('@') ? input.toLowerCase() : await getAuthEmailByUsn(input.toUpperCase());
      if (!targetEmail) {
        setForgotFeedback({ type: 'error', message: 'No registered account found with this identifier.' });
        setForgotLoading(false);
        isForgotSubmittingRef.current = false;
        return;
      }

      await requestPasswordReset(targetEmail);
      setForgotFeedback({
        type: 'success',
        message: `Password reset link sent to your personal email (${targetEmail}). Please check your inbox and spam folder.`,
      });
      setForgotCooldown(60); // 60s cooldown to avoid email rate limits
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit') || err.status === 429) {
        setForgotCooldown(60);
        setForgotFeedback({
          type: 'error',
          message: 'Email rate limit reached. Please wait a few minutes before requesting another reset email.',
        });
      } else {
        setForgotFeedback({ type: 'error', message: err.message || 'Failed to send reset email.' });
      }
    } finally {
      setForgotLoading(false);
      isForgotSubmittingRef.current = false;
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
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>

            {/* Controlled Resend Option for Unconfirmed Accounts */}
            {unconfirmedEmail && (
              <div className="pt-2 border-t border-red-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-[11px] text-red-700">
                  Didn't receive the activation email?
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-red-300 rounded-lg text-[11px] font-bold text-red-700 hover:bg-red-100/50 transition disabled:opacity-50 shrink-0"
                >
                  <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Wait (${resendCooldown}s)`
                      : 'Resend Verification Link'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {resendFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2 ${
              resendFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {resendFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            )}
            <span>{resendFeedback.message}</span>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotIdentifier(identifier);
                }}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your College USN or Personal Email. We will send a secure password reset link to your verified personal email address.
            </p>

            {forgotFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  USN or Personal Email
                </label>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. 1AH24CS221 or rahul@gmail.com"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || forgotCooldown > 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition disabled:opacity-50"
                >
                  {forgotLoading
                    ? 'Sending...'
                    : forgotCooldown > 0
                    ? `Wait (${forgotCooldown}s)`
                    : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

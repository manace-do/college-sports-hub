'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import {
  checkAdminStatus,
  verifyAndPromotePrimaryAdmin,
  isSupabaseConfigured,
} from '../../../lib/supabaseClient';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  GraduationCap,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

export default function AdminSetupPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loading: authLoading, refreshProfile, signOut } = useAuth();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Expected designated primary admin USN
  const PRIMARY_ADMIN_USN = '1AH24CS212';

  // Check whether an administrator already exists
  useEffect(() => {
    async function loadAdminStatus() {
      try {
        const status = await checkAdminStatus();
        setAdminExists(status.hasAdmin);
        setAdminCount(status.adminCount);
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setCheckingStatus(false);
      }
    }

    loadAdminStatus();
  }, []);

  const loggedInUsn =
    profile?.usn ||
    user?.user_metadata?.usn ||
    (user?.email?.includes('@') ? user.email.split('@')[0].toUpperCase() : null);

  const isDesignatedUsn = loggedInUsn?.toUpperCase() === PRIMARY_ADMIN_USN;

  // Handle one-time activation
  const handleActivateAdmin = async () => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      const result = await verifyAndPromotePrimaryAdmin(PRIMARY_ADMIN_USN);
      setSuccessResult(result);
      await refreshProfile();
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      console.error('Error activating admin account:', err);
      setErrorMessage(err.message || 'Failed to activate administrator privileges.');
    } finally {
      setProcessing(false);
    }
  };

  const sqlSnippet = `-- Execute one-time primary admin promotion in Supabase SQL Editor:
SELECT promote_primary_admin('${PRIMARY_ADMIN_USN}');`;

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(sqlSnippet);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  if (checkingStatus || authLoading) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Verifying system administrator status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-6 sm:my-10 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 mx-auto shadow-xs">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          One-Time Administrator Setup
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Role-Based Access Control initialization for Dr. A.C.S. College of Engineering (ACSCE) Sports Hub. This secure bootstrap assigns server-controlled administrator rights to the verified primary account.
        </p>
      </div>

      {/* Case 1: Already Initialized & Locked */}
      {adminExists && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Administrator Account Already Initialized
              </h2>
              <p className="text-sm text-slate-600">
                The Sports Hub primary administrator has already been verified and activated. The one-time setup wizard is now permanently locked against further execution.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status: Protected & Enforced</span>
            </div>
            <p>
              To manage sports, teams, players, users, and portal settings, sign in with your verified administrator account.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition"
              >
                Go to Admin Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
              >
                Sign In to Admin Account
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* Case 2: Not Yet Initialized - Process Steps */}
      {!adminExists && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Setup Error</p>
                <p className="text-xs">{errorMessage}</p>
              </div>
            </div>
          )}

          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Administrator Initialized Successfully!</p>
                <p className="text-xs">
                  Account {successResult.usn} has been verified and assigned administrator authority. Redirecting to your Admin Dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Sub-case 2A: Not Logged In */}
          {!user && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                <p className="font-bold text-sm text-blue-950 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Step 1: Sign Up or Log In with Primary USN
                </p>
                <p>
                  To prevent unauthorized privilege escalation, administrator rights cannot be granted anonymously. First create your account or sign in using USN{' '}
                  <span className="font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">
                    {PRIMARY_ADMIN_USN}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
                >
                  Register Account ({PRIMARY_ADMIN_USN})
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  Log In
                </Link>
              </div>
            </div>
          )}

          {/* Sub-case 2B: Logged In as Non-Admin USN */}
          {user && !isDesignatedUsn && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Unauthorized Account</span>
                </div>
                <p>
                  You are currently logged in as USN{' '}
                  <span className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">
                    {loggedInUsn || user.email}
                  </span>
                  . Only the designated administrator USN ({PRIMARY_ADMIN_USN}) can activate the primary admin role.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                >
                  Sign Out & Switch Account
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* Sub-case 2C: Logged In as 1AH24CS212 and Ready to Activate */}
          {user && isDesignatedUsn && !successResult && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Designated Administrator Account Detected</span>
                </div>
                <p>
                  Logged in as <span className="font-mono font-bold">{PRIMARY_ADMIN_USN}</span> ({profile?.name || user.email}).
                  Click below to finalize setup and assign permanent, server-controlled administrator rights to your account.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">What happens when you activate:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Your user profile is assigned <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">is_admin = true</code> in the database.</li>
                  <li>All future one-time setup calls will be permanently locked out.</li>
                  <li>You will gain complete control over sports, players, registered users, and portal settings.</li>
                </ul>
              </div>

              <button
                onClick={handleActivateAdmin}
                disabled={processing}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{processing ? 'Verifying & Initializing Account...' : 'Activate Primary Administrator Role'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SQL Snippet Reference for Direct Supabase Execution */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Terminal className="w-4 h-4 text-brand-600" />
            <span>Database SQL Stored Procedure Alternative</span>
          </div>
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          If you prefer executing the bootstrap procedure directly in your Supabase SQL Editor:
        </p>

        <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto">
          {sqlSnippet}
        </pre>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { Trophy, Users, LogIn, Menu, X, Shield, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, signOut, loading } = useAuth();

  const currentUsn =
    profile?.usn ||
    user?.user_metadata?.usn ||
    (user?.email?.includes('@') ? user.email.split('@')[0].toUpperCase() : null);
  const isDesignatedPendingAdmin = !isAdmin && currentUsn?.toUpperCase() === '1AH24CS212';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-700 transition">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 leading-tight">Sports Hub</span>
                <span className="text-xs text-slate-500 font-medium">Dr. A.C.S. College of Engineering (ACSCE)</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:ml-8 md:space-x-3">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-brand-700 bg-brand-50 rounded-lg"
              >
                <Trophy className="w-4 h-4 mr-1.5" />
                Sports Directory
              </Link>
              <Link
                href="/requests"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Team Requests
              </Link>

              {/* Profile Link in main nav for logged in students */}
              {user && (
                <Link
                  href="/profile"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  <User className="w-4 h-4 mr-1.5 text-slate-500" />
                  My Profile
                </Link>
              )}

              {/* Admin Link: ONLY visible when is_admin is true */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  Admin
                </Link>
              )}

              {/* Pending Setup Link: ONLY visible to 1AH24CS212 prior to bootstrap */}
              {isDesignatedPendingAdmin && (
                <Link
                  href="/admin/setup"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-dashed border-purple-300 rounded-lg transition"
                >
                  <Shield className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Admin Setup
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {!loading && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  {profile?.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile?.name || 'Profile'}
                      className="w-6 h-6 rounded-full object-cover mr-2 border border-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mr-2">
                      {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span>{profile?.name || user.email?.split('@')[0] || 'Profile'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : !loading ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 pt-2 pb-4 space-y-2 bg-white shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-3 py-2 rounded-lg text-base font-semibold text-brand-700 bg-brand-50"
          >
            <Trophy className="w-5 h-5 mr-3" />
            Sports Directory
          </Link>
          <Link
            href="/requests"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            <Users className="w-5 h-5 mr-3" />
            Team Requests
          </Link>

          {/* Admin Link on Mobile: ONLY when is_admin is true */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-base font-semibold text-purple-700 bg-purple-50 border border-purple-200"
            >
              <Shield className="w-5 h-5 mr-3" />
              Admin Dashboard
            </Link>
          )}

          {isDesignatedPendingAdmin && (
            <Link
              href="/admin/setup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-base font-semibold text-purple-700 bg-purple-50 border border-dashed border-purple-300"
            >
              <Shield className="w-5 h-5 mr-3" />
              Admin Setup
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {!loading && user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {profile?.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile?.name || 'Profile'}
                      className="w-5 h-5 rounded-full object-cover mr-2.5 border border-slate-200"
                    />
                  ) : (
                    <User className="w-4 h-4 mr-2.5 text-slate-500" />
                  )}
                  <span>{profile?.name || 'My Profile'}</span>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}

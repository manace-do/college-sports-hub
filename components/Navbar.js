'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, LogIn, Menu, X, Shield } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                <span className="text-xs text-slate-500 font-medium">College Athletics & Casual Teams</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:ml-8 md:space-x-4">
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
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
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
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
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
          </div>
        </div>
      )}
    </nav>
  );
}

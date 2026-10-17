'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSports, getSiteSettings } from '../lib/supabaseClient';
import SportCard from '../components/SportCard';
import { Trophy, Search, Filter, Users, Sparkles, ArrowRight, MapPin, User } from 'lucide-react';

export default function HomePage() {
  const [sports, setSports] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [sportsData, settingsData] = await Promise.all([
          getSports(),
          getSiteSettings(),
        ]);
        setSports(sportsData || []);
        setSettings(settingsData);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError('Failed to load sports directory.');
        setSports([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const portalConfig = settings?.portal_config;
  const contactInfo = settings?.contact_info;
  const coachProfile = settings?.coach_profile;

  // Filter sports by category and search query
  const filteredSports = sports.filter((sport) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      sport.category?.toLowerCase() === selectedCategory.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      sport.name?.toLowerCase().includes(query) ||
      (sport.description && sport.description.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  // Group filtered sports by category (Strictly Men and Women)
  const categories = [
    { key: 'men', title: "Men's Sports", color: 'border-blue-200 bg-blue-50/50' },
    { key: 'women', title: "Women's Sports", color: 'border-fuchsia-200 bg-fuchsia-50/50' },
  ];

  // Helper count for tabs
  const getCategoryCount = (categoryKey) => {
    if (categoryKey === 'all') return sports.length;
    return sports.filter((s) => s.category?.toLowerCase() === categoryKey.toLowerCase()).length;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <Trophy className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-medium text-brand-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{portalConfig?.portal_title || 'Dr. A.C.S. College of Engineering (ACSCE)'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {portalConfig?.tagline || 'Official Sports Portal & Team Directory'}
          </h1>

          <p className="text-sm sm:text-base text-brand-100 leading-relaxed">
            {portalConfig?.welcome_message ||
              'Browse official ACSCE team players, view captains, or find teammates for casual evening games without having to ask anyone directly.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="#sports-directory"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-900 bg-white hover:bg-brand-50 shadow-sm transition"
            >
              Browse Sports Directory
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </a>
            <Link
              href="/requests"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Casual Team Requests
            </Link>
          </div>
        </div>
      </section>

      {/* Main Directory Area */}
      <section id="sports-directory" className="space-y-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-brand-600" />
              Sports Directory
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Select a sport to inspect official team players and squad captains
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sports..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getCategoryCount('all')}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('men')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              selectedCategory === 'men'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Men's Teams</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'men'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getCategoryCount('men')}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('women')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              selectedCategory === 'women'
                ? 'bg-fuchsia-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Women's Teams</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'women'
                  ? 'bg-fuchsia-700 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getCategoryCount('women')}
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for Search / Filter */}
        {!loading && filteredSports.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No sports found</h3>
            <p className="text-xs text-slate-500">
              No college sports matched {searchQuery ? `"${searchQuery}"` : 'the selected category'}. Try resetting your search query or selecting a different category tab.
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Sports Display: Grouped by Category when "All Categories" is selected */}
        {!loading && selectedCategory === 'all' && filteredSports.length > 0 && (
          <div className="space-y-10">
            {categories.map((category) => {
              const categorySports = filteredSports.filter(
                (s) => s.category?.toLowerCase() === category.key
              );

              if (categorySports.length === 0) return null;

              return (
                <div key={category.key} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>{category.title}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {categorySports.length}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categorySports.map((sport) => (
                      <SportCard key={sport.id} sport={sport} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sports Display: Flat Grid when a specific category tab is selected */}
        {!loading && selectedCategory !== 'all' && filteredSports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSports.map((sport) => (
              <SportCard key={sport.id} sport={sport} />
            ))}
          </div>
        )}
      </section>

      {/* Department of Physical Education and Sports Information */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="border-b border-slate-200/80 pb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            {contactInfo?.department || 'Department of Physical Education and Sports'}
          </h3>
          <p className="text-xs text-slate-500">
            Dr. A.C.S. College of Engineering (ACSCE) • Official Department of Physical Education and Sports
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          {/* Sports Room Location */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-slate-500">
                Sports Room
              </span>
              <span className="text-slate-900 font-extrabold text-sm block mt-0.5">
                {contactInfo?.location || 'Third Floor'}
              </span>
              <span className="text-slate-400 text-[11px] block mt-0.5">
                ACSCE Main Campus
              </span>
            </div>
          </div>

          {/* Shared College Head Coach */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-brand-700 block">
                College Head Coach (All Sports)
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                {coachProfile?.name || 'Head Coach'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {coachProfile?.title || 'Director of Physical Education'} • Sports Room — Third Floor
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

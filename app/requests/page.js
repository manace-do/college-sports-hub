'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured, STARTER_REQUESTS } from '../../lib/supabaseClient';
import RequestCard from '../../components/RequestCard';
import { Users, Plus, Search, Filter, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('team_requests')
            .select('*, sports(name)')
            .order('scheduled_time', { ascending: true });

          if (error) {
            console.error('Error fetching requests:', error.message);
            setRequests([]);
          } else {
            setRequests(data || []);
          }
        } catch (err) {
          console.error('Error fetching requests:', err);
          setRequests([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Local preview mode
      try {
        const raw = localStorage.getItem('sports_hub_custom_requests');
        if (raw) {
          setRequests(JSON.parse(raw));
        } else {
          setRequests(STARTER_REQUESTS);
        }
      } catch (e) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    // Filter by type
    const matchesType =
      selectedType === 'all' || req.type?.toLowerCase() === selectedType.toLowerCase();

    // Filter by status (open vs all)
    const matchesStatus =
      selectedStatus === 'all' || req.status === selectedStatus;

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      req.title?.toLowerCase().includes(q) ||
      (req.description && req.description.toLowerCase().includes(q)) ||
      (req.sports?.name && req.sports.name.toLowerCase().includes(q)) ||
      (req.skill_tags && req.skill_tags.some((tag) => tag.toLowerCase().includes(q)));

    return matchesType && matchesStatus && matchesSearch;
  });

  const types = [
    { key: 'all', label: 'All Requests' },
    { key: 'sport', label: 'Sports' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'hackathon', label: 'Hackathons' },
    { key: 'event', label: 'Campus Events' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
            <Users className="w-3.5 h-3.5" />
            <span>Casual Games & Groups</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Team Requests
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Find teammates for casual matches, runs, or hackathons. Tap Join with no messaging or walking up to strangers.
          </p>
        </div>

        <div>
          <Link
            href="/requests/new"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Post a Request
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {types.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedType(t.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  selectedType === t.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Toggle & Search */}
          <div className="flex items-center gap-3">
            {/* Status Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setSelectedStatus('open')}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === 'open'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open Only
              </button>
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Statuses
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-4"
            >
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-2 bg-slate-200 rounded-full w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRequests.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No requests match your filter</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No requests found matching "${searchQuery}".`
              : 'There are currently no requests matching this category or status.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Reset filters
            </button>
            <span className="text-slate-300">|</span>
            <Link
              href="/requests/new"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Post your own request
            </Link>
          </div>
        </div>
      )}

      {/* Requests Grid */}
      {!loading && filteredRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Back to sports directory link banner */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Looking for official college teams?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            View official team players, captains, and sports in the Sports Directory.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs whitespace-nowrap"
        >
          <Trophy className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
          Browse Sports Directory
        </Link>
      </div>
    </div>
  );
}
